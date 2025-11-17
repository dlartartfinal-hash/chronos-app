

'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo } from 'react';
import * as z from 'zod';
import { CartItem } from '@/app/dashboard/pdv/page';
import { useUser } from './user-context';
import { PlaceHolderImages } from '@/lib/placeholder-images';
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


export type Product = z.infer<typeof productSchema> & { imageId?: string };
export type ProductVariation = z.infer<typeof variationSchema>;
export type Service = z.infer<typeof serviceSchema> & { imageId?: string; imageUrl: string };
export type Collaborator = z.infer<typeof collaboratorSchema>;
export type Category = z.infer<typeof categorySchema>;

// --- Initial Data ---
const initialProducts: Product[] = [];
const initialServices: Service[] = [];
const initialCollaborators: Collaborator[] = [];
const initialCategories: Category[] = [];

interface InventoryContextType {
  products: Product[];
  services: Service[];
  collaborators: Collaborator[];
  categories: Category[];
  productCategories: string[];
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;
  addService: (service: Service) => void;
  updateService: (service: Service) => void;
  deleteService: (serviceId: string) => void;
  deductStock: (items: CartItem[]) => void;
  addCollaborator: (collaborator: Omit<Collaborator, 'id' | 'status' | 'createdAt'>) => void;
  updateCollaborator: (collaborator: Collaborator) => void;
  setCollaboratorStatus: (id: string, status: 'Ativo' | 'Inativo') => void;
  addCategory: (name: string) => string | null;
  updateCategory: (category: Category) => void;
  deleteCategory: (categoryId: string) => void;
  countProductsInCategory: (categoryId: string) => number;
  refreshInventory: () => Promise<void>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

const getStorageKey = (userEmail: string, key: string) => `${userEmail}_${key}`;

// Helper to migrate old imageId to new imageUrl
const migrateImageData = (item: any) => {
    if (item.imageId && !item.imageUrl) {
        const placeholder = PlaceHolderImages.find(p => p.id === item.imageId);
        item.imageUrl = placeholder ? placeholder.imageUrl : '';
    }
    // delete item.imageId; // Optional: clean up old field
    return item;
}

export function InventoryProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const productCategories = useMemo(() => [...new Set(products.map(p => p.category))], [products]);

  useEffect(() => {
    if (user) {
        const userEmail = user.email;

        const loadData = (key: string, initialData: any[], migrationFn?: (item: any) => any) => {
            try {
                const storageKey = getStorageKey(userEmail, key);
                let storedData = localStorage.getItem(storageKey);
                if (storedData) {
                    let parsedData = JSON.parse(storedData);
                    let didMigrate = false;
                    if (migrationFn) {
                       parsedData = parsedData.map((item: any) => {
                           const originalItem = JSON.stringify(item);
                           const migratedItem = migrationFn(item);
                           if (JSON.stringify(migratedItem) !== originalItem) {
                               didMigrate = true;
                           }
                           return migratedItem;
                       });
                       // Re-save data if migration happened
                       if (didMigrate) {
                           localStorage.setItem(storageKey, JSON.stringify(parsedData));
                       }
                    }
                    return parsedData;
                }
                localStorage.setItem(storageKey, JSON.stringify(initialData));
                return initialData;
            } catch (error) {
                console.error(`Failed to handle ${key} from localStorage`, error);
                return initialData;
            }
        };

        setProducts(loadData('inventory_products', initialProducts, migrateImageData));
        setServices(loadData('inventory_services', initialServices, migrateImageData));
        setCollaborators(loadData('inventory_collaborators', initialCollaborators));
        setCategories(loadData('inventory_categories', initialCategories));
        
        setIsInitialized(true);
    } else {
        // Clear data on logout
        setProducts([]);
        setServices([]);
        setCollaborators([]);
        setCategories([]);
        setIsInitialized(false);
    }
}, [user]);

  const saveData = useCallback((key: string, data: any) => {
    if (!user) return;
    try {
      const storageKey = getStorageKey(user.email, key);
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch (error) {
      console.error(`Failed to write ${key} to localStorage`, error);
    }
  }, [user]);
  
  const addProduct = useCallback((product: Product) => {
    const newProduct = { ...product, id: `prod-${Date.now()}` };
    setProducts(prev => {
        const newState = [...prev, newProduct];
        saveData('inventory_products', newState);
        return newState;
    });
  }, [saveData]);

  const updateProduct = useCallback((product: Product) => {
    setProducts(prev => {
        const newState = prev.map(p => p.id === product.id ? product : p);
        saveData('inventory_products', newState);
        return newState;
    });
  }, [saveData]);

  const deleteProduct = useCallback((productId: string) => {
    setProducts(prev => {
        const newState = prev.filter(p => p.id !== productId);
        saveData('inventory_products', newState);
        return newState;
    });
  }, [saveData]);
  
  const addService = useCallback((service: Service) => {
    const newService = { ...service, id: `serv-${Date.now()}` };
    setServices(prev => {
        const newState = [...prev, newService];
        saveData('inventory_services', newState);
        return newState;
    });
  }, [saveData]);

  const updateService = useCallback((service: Service) => {
    setServices(prev => {
        const newState = prev.map(s => s.id === service.id ? service : s);
        saveData('inventory_services', newState);
        return newState;
    });
  }, [saveData]);

  const deleteService = useCallback((serviceId: string) => {
    setServices(prev => {
        const newState = prev.filter(s => s.id !== serviceId);
        saveData('inventory_services', newState);
        return newState;
    });
  }, [saveData]);

  const deductStock = useCallback((itemsToDeduct: CartItem[]) => {
    setProducts(prevProducts => {
      const updatedProducts = JSON.parse(JSON.stringify(prevProducts)); // Deep copy

      itemsToDeduct.forEach(item => {
        for (const product of updatedProducts) {
          if (product.hasVariations && product.variations) {
            const variation = product.variations.find((v: ProductVariation) => v.sku === item.id);
            if (variation) {
              variation.stock = Math.max(0, variation.stock - item.quantity);
              return; 
            }
          } else {
            if (product.sku === item.id) {
              product.stock = Math.max(0, (product.stock || 0) - item.quantity);
              return;
            }
          }
        }
      });
      
      saveData('inventory_products', updatedProducts);
      return updatedProducts;
    });
  }, [saveData]);

  const addCollaborator = useCallback((collaborator: Omit<Collaborator, 'id' | 'status' | 'createdAt'>) => {
    const newCollaborator = { 
        ...collaborator, 
        id: `colab-${Date.now()}`,
        status: 'Ativo' as const,
        createdAt: new Date().toISOString()
    };
    setCollaborators(prev => {
        const newState = [...prev, newCollaborator];
        saveData('inventory_collaborators', newState);
        return newState;
    });
  }, [saveData]);

  const updateCollaborator = useCallback((collaborator: Collaborator) => {
    setCollaborators(prev => {
        const newState = prev.map(c => c.id === collaborator.id ? collaborator : c);
        saveData('inventory_collaborators', newState);
        return newState;
    });
  }, [saveData]);

  const setCollaboratorStatus = useCallback((id: string, status: 'Ativo' | 'Inativo') => {
    setCollaborators(prev => {
        const newState = prev.map(c => c.id === id ? { ...c, status } : c);
        saveData('inventory_collaborators', newState);
        return newState;
    });
  }, [saveData]);
  
  const addCategory = useCallback((name: string): string | null => {
    const newCategory: Category = { id: `cat-${Date.now()}`, name };
    let createdCategoryName: string | null = null;
    setCategories(prev => {
        const newState = [...prev, newCategory];
        saveData('inventory_categories', newState);
        createdCategoryName = newCategory.name;
        return newState;
    });
    return createdCategoryName;
  }, [saveData]);

  const updateCategory = useCallback((category: Category) => {
    const oldCategoryName = categories.find(c => c.id === category.id)?.name;
    setCategories(prev => {
      const newState = prev.map(c => (c.id === category.id ? category : c));
      saveData('inventory_categories', newState);
      return newState;
    });
     setProducts(prev => {
      const updatedProducts = prev.map(p => 
        p.category === oldCategoryName 
        ? { ...p, category: category.name } 
        : p
      );
      saveData('inventory_products', updatedProducts);
      return updatedProducts;
    });
  }, [saveData, categories]);
  
  const deleteCategory = useCallback((categoryId: string) => {
    setCategories(prev => {
      const newState = prev.filter(c => c.id !== categoryId);
      saveData('inventory_categories', newState);
      return newState;
    });
  }, [saveData]);

  const countProductsInCategory = useCallback((categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return 0;
    return products.filter(p => p.category === category.name).length;
  }, [products, categories]);

  const refreshInventory = useCallback(async () => {
    // Placeholder - will be implemented when migrating to API
    return Promise.resolve();
  }, []);

  const value = { 
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
    };

  if (!isInitialized && user) {
    return null; // or a loading skeleton
  }

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
}
