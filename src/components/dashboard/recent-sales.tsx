
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Sale } from '@/context/sales-context';
import { formatCurrency } from '@/lib/utils';
import { useCustomer } from '@/context/customer-context';

interface RecentSalesProps {
    sales: Sale[];
}

export function RecentSales({ sales }: RecentSalesProps) {
  const { customers } = useCustomer();

  return (
    <div className="space-y-8">
      {sales.map((sale) => {
        const customer = customers.find(c => c.name === sale.client);
        const userAvatar = PlaceHolderImages.find((img) => img.id === customer?.avatarId);
        const fallback = sale.client.split(' ').map(c => c[0]).join('');

        return (
          <div key={sale.id} className="flex items-center">
            <Avatar className="h-9 w-9">
              {userAvatar && <AvatarImage src={userAvatar.imageUrl} alt="Avatar" data-ai-hint={userAvatar.imageHint} />}
              <AvatarFallback>{fallback}</AvatarFallback>
            </Avatar>
            <div className="ml-4 space-y-1">
              <p className="text-sm font-medium leading-none">{sale.client}</p>
              <p className="text-sm text-muted-foreground">{customer?.email || 'email@naoencontrado.com'}</p>
            </div>
            <div className="ml-auto font-medium">{formatCurrency(sale.total)}</div>
          </div>
        );
      })}
    </div>
  );
}

    