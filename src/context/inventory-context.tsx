'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo } from 'react';
import * as z from 'zod';
import { CartItem } from '@/app/dashboard/pdv/page';
import { useUser } from './user-context';
import { apiRequest } from '@/lib/api';

// --- Schemas and Types ---
const collaboratorSchema = z.object({
  id: z.string(),
  name: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres.' }),
  pin: z.string().length(4, { message: 'O PIN deve ter exatamente 4 dígitos.' }).regex(/^\d{4}$/, { message: 'O PIN deve conter apenas números.' }),
  canModifyItems: z.boolean().default(false),
  avatarId: z.string({ required_error: 'Por favor, selecione um avatar.'}),
  status: z.enum(['Ativo', 'Inativo']),
  createdAt: z.string(), // ISO date string
});

const variationSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, { message: 'O nome da variação é obrigatória.'}),
  sku: z.string().optional(),
  stock: z.coerce.number().min(0, { message: 'O estoque não pode ser negativo.' }),
  price: z.coerce.number().min(0.01, { message: 'O preço deve ser positivo.' }),
  cost: z.coerce.number().min(0, { message: 'O custo não pode ser negativo.' }).optional(),
});

export const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, { message: 'O nome do produto é obrigatório.' }),
  imageUrl: z.string().url({ message: 'Por favor, insira uma URL de imagem válida.' }).or(z.literal('')),
  category: z.string().min(1, { message: 'A categoria é obrigatória.' }),
  hasVariations: z.boolean().default(false),
  sku: z.string().optional(),
  stock: z.coerce.number().optional(),
  price: z.coerce.number().optional(),
  cost: z.coerce.number().optional(),
  variations: z.array(variationSchema).optional(),
}).superRefine((data, ctx) => {
  if (data.hasVariations) {
    if (!data.variations || data.variations.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['variations'],
        message: 'Adicione pelo menos uma variação.',
      });
    }
  } else {
    if (data.stock === undefined || data.stock === null) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['stock'], message: 'Estoque é obrigatório.' });
    }
     if (!data.price) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['price'], message: 'Preço é obrigatório.' });
    }
  }
});

export const serviceSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, { message: 'O nome do serviço é obrigatório.' }),
  code: z.string().min(1, { message: 'O código é obrigatório.' }),
  price: z.coerce.number().min(0.01, { message: 'O preço deve ser positivo.' }),
  cost: z.coerce.number().min(0, { message: 'O custo não pode ser negativo.' }).optional(),
  imageUrl: z.string().url({ message: 'Por favor, insira uma URL de imagem válida.' }).or(z.literal('')),
});

export const categorySchema = z.object({
    id: z.string(),
    name: z.string(),
});

export type Product = z.infer<typeof productSchema> & { imageId?: string; categoryId?: string };
export type ProductVariation = z.infer<typeof variationSchema>;
export type Service = z.infer<typeof serviceSchema> & { imageId?: string; imageUrl: string };
export type Collaborator = z.infer<typeof collaboratorSchema>;
export type Category = z.infer<typeof categorySchema>;

interface InventoryContextType {
  products: Product[];
  services: Service[];
  collaborators: Collaborator[];
  categories: Category[];
  productCategories: string[];
  addProduct: (product: Product) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  addService: (service: Service) => Promise<void>;
  updateService: (service: Service) => Promise<void>;
  deleteService: (serviceId: string) => Promise<void>;
  deductStock: (items: CartItem[]) => void;
  addCollaborator: (collaborator: Omit<Collaborator, 'id' | 'status' | 'createdAt'>) => Promise<void>;
  updateCollaborator: (collaborator: Collaborator) => Promise<void>;
  setCollaboratorStatus: (id: string, status: 'Ativo' | 'Inativo') => Promise<void>;
  addCategory: (name: string) => Promise<string | null>;
  updateCategory: (category: Category) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;
  countProductsInCategory: (categoryId: string) => number;
  refreshInventory: () => Promise<void>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export function InventoryProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const productCategories = useMemo(() => [...new Set(products.map(p => p.category))], [products]);

  // Refresh all inventory data from API
  const refreshInventory = useCallback(async () => {
    if (!user) return;

    try {
      const [productsData, servicesData, categoriesData, collaboratorsData] = await Promise.all([
        apiRequest<any[]>('products'),
        apiRequest<any[]>('services'),
        apiRequest<any[]>('categories'),
        apiRequest<any[]>('collaborators'),
      ]);

      // Transform products from API (with cents) to app format (with decimals)
      const transformedProducts = productsData.map((p: any) => ({
        id: p.id,
        name: p.name,
        category: p.category?.name || '',
        categoryId: p.categoryId,
        imageUrl: p.imageUrl || '',
        imageId: p.imageId || '',
        hasVariations: p.hasVariations,
        sku: p.sku || '',
        stock: p.stock || 0,
        price: p.priceCents ? p.priceCents / 100 : 0,
        cost: p.costCents ? p.costCents / 100 : 0,
        variations: p.variations?.map((v: any) => ({
          id: v.id,
          name: v.name,
          sku: v.sku || '',
          stock: v.stock || 0,
          price: v.priceCents / 100,
          cost: v.costCents ? v.costCents / 100 : 0,
        })) || []
      }));

      // Transform services from API
      const transformedServices = servicesData.map((s: any) => ({
        id: s.id,
        name: s.name,
        code: s.code || '',
        price: s.priceCents / 100,
        cost: s.costCents ? s.costCents / 100 : 0,
        imageUrl: s.imageUrl || '',
        imageId: s.imageId || '',
      }));

      setProducts(transformedProducts);
      setServices(transformedServices);
      setCategories(categoriesData);
      setCollaborators(collaboratorsData);
      setIsInitialized(true);
    } catch (error) {
      console.error('Error refreshing inventory:', error);
    }
  }, [user]);

  // Load data on mount
  useEffect(() => {
    if (user && !isInitialized) {
      refreshInventory();
    }
  }, [user, isInitialized, refreshInventory]);

  // --- Products ---
  const addProduct = useCallback(async (product: Product) => {
    if (!user) return;

    try {
      const categoryObj = categories.find(c => c.name === product.category);
      
      const payload = {
        name: product.name,
        categoryId: categoryObj?.id || null,
        imageUrl: product.imageUrl || null,
        imageId: product.imageId || null,
        hasVariations: product.hasVariations,
        sku: product.sku || null,
        stock: product.hasVariations ? null : product.stock,
        priceCents: product.hasVariations ? null : Math.round((product.price || 0) * 100),
        costCents: product.hasVariations ? null : Math.round((product.cost || 0) * 100),
        variations: product.hasVariations ? product.variations?.map(v => ({
          name: v.name,
          sku: v.sku || null,
          stock: v.stock || 0,
          priceCents: Math.round(v.price * 100),
          costCents: Math.round((v.cost || 0) * 100),
        })) : []
      };

      await apiRequest('products', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      await refreshInventory();
    } catch (error) {
      console.error('Error adding product:', error);
      throw error;
    }
  }, [user, categories, refreshInventory]);

  const updateProduct = useCallback(async (product: Product) => {
    if (!user) return;

    try {
      const categoryObj = categories.find(c => c.name === product.category);
      
      const payload = {
        id: product.id,
        name: product.name,
        categoryId: categoryObj?.id || null,
        imageUrl: product.imageUrl || null,
        imageId: product.imageId || null,
        hasVariations: product.hasVariations,
        sku: product.sku || null,
        stock: product.hasVariations ? null : product.stock,
        priceCents: product.hasVariations ? null : Math.round((product.price || 0) * 100),
        costCents: product.hasVariations ? null : Math.round((product.cost || 0) * 100),
        variations: product.hasVariations ? product.variations?.map(v => ({
          name: v.name,
          sku: v.sku || null,
          stock: v.stock || 0,
          priceCents: Math.round(v.price * 100),
          costCents: Math.round((v.cost || 0) * 100),
        })) : []
      };

      await apiRequest('products', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      await refreshInventory();
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  }, [user, categories, refreshInventory]);

  const deleteProduct = useCallback(async (productId: string) => {
    if (!user) return;

    try {
      await apiRequest(`products?id=${productId}`, {
        method: 'DELETE',
      });

      await refreshInventory();
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  }, [user, refreshInventory]);

  // --- Services ---
  const addService = useCallback(async (service: Service) => {
    if (!user) return;

    try {
      const payload = {
        name: service.name,
        code: service.code,
        price: service.price,
        cost: service.cost || null,
        imageUrl: service.imageUrl || null,
        imageId: service.imageId || null,
      };

      await apiRequest('services', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      await refreshInventory();
    } catch (error) {
      console.error('Error adding service:', error);
      throw error;
    }
  }, [user, refreshInventory]);

  const updateService = useCallback(async (service: Service) => {
    if (!user) return;

    try {
      const payload = {
        id: service.id,
        name: service.name,
        code: service.code,
        price: service.price,
        cost: service.cost || null,
        imageUrl: service.imageUrl || null,
        imageId: service.imageId || null,
      };

      await apiRequest('services', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      await refreshInventory();
    } catch (error) {
      console.error('Error updating service:', error);
      throw error;
    }
  }, [user, refreshInventory]);

  const deleteService = useCallback(async (serviceId: string) => {
    if (!user) return;

    try {
      await apiRequest(`services?id=${serviceId}`, {
        method: 'DELETE',
      });

      await refreshInventory();
    } catch (error) {
      console.error('Error deleting service:', error);
      throw error;
    }
  }, [user, refreshInventory]);

  // --- Stock Deduction (local only for now) ---
  const deductStock = useCallback((items: CartItem[]) => {
    setProducts(prevProducts => {
      return prevProducts.map(product => {
        const cartItem = items.find(item => item.id === product.id);
        if (!cartItem) return product;

        if (product.hasVariations && product.variations) {
          const updatedVariations = product.variations.map(variation => {
            const matchingItem = items.find(
              item => item.id === product.id && item.selectedVariation === variation.name
            );
            if (matchingItem) {
              return {
                ...variation,
                stock: Math.max(0, (variation.stock || 0) - matchingItem.quantity),
              };
            }
            return variation;
          });
          return { ...product, variations: updatedVariations };
        } else {
          return {
            ...product,
            stock: Math.max(0, (product.stock || 0) - cartItem.quantity),
          };
        }
      });
    });
  }, []);

  // --- Collaborators ---
  const addCollaborator = useCallback(async (collaborator: Omit<Collaborator, 'id' | 'status' | 'createdAt'>) => {
    if (!user) return;

    try {
      const payload = {
        name: collaborator.name,
        pin: collaborator.pin,
        canModifyItems: collaborator.canModifyItems,
        avatarId: collaborator.avatarId,
      };

      await apiRequest('collaborators', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      await refreshInventory();
    } catch (error) {
      console.error('Error adding collaborator:', error);
      throw error;
    }
  }, [user, refreshInventory]);

  const updateCollaborator = useCallback(async (collaborator: Collaborator) => {
    if (!user) return;

    try {
      const payload = {
        id: collaborator.id,
        name: collaborator.name,
        pin: collaborator.pin,
        canModifyItems: collaborator.canModifyItems,
        avatarId: collaborator.avatarId,
        status: collaborator.status,
      };

      await apiRequest('collaborators', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      await refreshInventory();
    } catch (error) {
      console.error('Error updating collaborator:', error);
      throw error;
    }
  }, [user, refreshInventory]);

  const setCollaboratorStatus = useCallback(async (id: string, status: 'Ativo' | 'Inativo') => {
    if (!user) return;

    try {
      const collaborator = collaborators.find(c => c.id === id);
      if (!collaborator) return;

      const payload = {
        id,
        status,
        name: collaborator.name,
        pin: collaborator.pin,
        canModifyItems: collaborator.canModifyItems,
        avatarId: collaborator.avatarId,
      };

      await apiRequest('collaborators', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      await refreshInventory();
    } catch (error) {
      console.error('Error updating collaborator status:', error);
      throw error;
    }
  }, [user, collaborators, refreshInventory]);

  // --- Categories ---
  const addCategory = useCallback(async (name: string): Promise<string | null> => {
    if (!user) return null;

    try {
      const response = await apiRequest<Category>('categories', {
        method: 'POST',
        body: JSON.stringify({ name }),
      });

      await refreshInventory();
      return response.id;
    } catch (error) {
      console.error('Error adding category:', error);
      return null;
    }
  }, [user, refreshInventory]);

  const updateCategory = useCallback(async (category: Category) => {
    if (!user) return;

    try {
      await apiRequest('categories', {
        method: 'PUT',
        body: JSON.stringify(category),
      });

      await refreshInventory();
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  }, [user, refreshInventory]);

  const deleteCategory = useCallback(async (categoryId: string) => {
    if (!user) return;

    try {
      await apiRequest(`categories?id=${categoryId}`, {
        method: 'DELETE',
      });

      await refreshInventory();
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  }, [user, refreshInventory]);

  const countProductsInCategory = useCallback((categoryId: string) => {
    return products.filter(p => p.categoryId === categoryId).length;
  }, [products]);

  return (
    <InventoryContext.Provider
      value={{
        products,
        services,
        collaborators,
        categories,
        productCategories,
        addProduct,
        updateProduct,
        deleteProduct,
        addService,
        updateService,
        deleteService,
        deductStock,
        addCollaborator,
        updateCollaborator,
        setCollaboratorStatus,
        addCategory,
        updateCategory,
        deleteCategory,
        countProductsInCategory,
        refreshInventory,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
}
