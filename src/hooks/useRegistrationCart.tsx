import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';
import { toast } from '@/components/ui/use-toast';

export interface CartItem {
  id: string;
  cart_id: string;
  registrant_type: 'self' | 'other';
  participant_name: string;
  participant_email: string;
  is_claimed: boolean;
  claimed_by_user_id: string | null;
  claim_token: string | null;
  partner_name: string | null;
  partner_email: string | null;
  school_organization: string | null;
  event_id: string | null;
  role: 'competitor' | 'judge';
  base_price: number;
  discount_amount: number;
  promo_code_id: string | null;
  additional_info: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface RegistrationCart {
  id: string;
  user_id: string;
  tournament_id: string;
  status: 'active' | 'checkout' | 'completed' | 'expired';
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface GroupDiscountRule {
  id: string;
  tournament_id: string;
  min_registrations: number;
  discount_type: 'percent' | 'fixed' | 'per_person';
  discount_value: number;
  is_active: boolean;
}

export interface CartSummary {
  subtotal: number;
  promoDiscounts: number;
  groupDiscount: number;
  groupDiscountRule: GroupDiscountRule | null;
  total: number;
  itemCount: number;
}

interface NewCartItem {
  registrant_type: 'self' | 'other';
  participant_name: string;
  participant_email: string;
  partner_name?: string;
  partner_email?: string;
  school_organization?: string;
  event_id?: string;
  role: 'competitor' | 'judge';
  base_price: number;
  promo_code_id?: string;
  discount_amount?: number;
  additional_info?: Record<string, any>;
}

export function useRegistrationCart(tournamentId: string | undefined) {
  const { user } = useOptimizedAuth();
  const [cart, setCart] = useState<RegistrationCart | null>(null);
  const [items, setItems] = useState<CartItem[]>([]);
  const [groupDiscountRules, setGroupDiscountRules] = useState<GroupDiscountRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch or create cart
  const fetchCart = useCallback(async () => {
    if (!user || !tournamentId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Try to find existing active cart
      const { data: existingCart, error: fetchError } = await supabase
        .from('registration_carts')
        .select('*')
        .eq('user_id', user.id)
        .eq('tournament_id', tournamentId)
        .eq('status', 'active')
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existingCart) {
        setCart(existingCart as RegistrationCart);
        await fetchItems(existingCart.id);
      } else {
        setCart(null);
        setItems([]);
      }

      // Fetch group discount rules
      await fetchGroupDiscounts();

    } catch (err: any) {
      console.error('Error fetching cart:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [user, tournamentId]);

  const fetchItems = async (cartId: string) => {
    const { data, error } = await supabase
      .from('cart_items')
      .select('*')
      .eq('cart_id', cartId)
      .order('created_at');

    if (error) throw error;
    setItems((data || []) as CartItem[]);
  };

  const fetchGroupDiscounts = async () => {
    if (!tournamentId) return;

    const { data } = await supabase
      .from('group_discount_rules')
      .select('*')
      .eq('tournament_id', tournamentId)
      .eq('is_active', true)
      .order('min_registrations', { ascending: false });

    setGroupDiscountRules((data || []) as GroupDiscountRule[]);
  };

  // Create cart if doesn't exist
  const ensureCart = async (): Promise<string | null> => {
    if (!user || !tournamentId) return null;

    if (cart) return cart.id;

    const { data, error } = await supabase
      .from('registration_carts')
      .insert({
        user_id: user.id,
        tournament_id: tournamentId,
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating cart:', error);
      toast({
        title: "Error",
        description: "Failed to create cart",
        variant: "destructive"
      });
      return null;
    }

    setCart(data as RegistrationCart);
    return data.id;
  };

  // Add item to cart
  const addItem = async (item: NewCartItem): Promise<CartItem | null> => {
    const cartId = await ensureCart();
    if (!cartId) return null;

    try {
      const { data, error } = await supabase
        .from('cart_items')
        .insert({
          cart_id: cartId,
          ...item,
          discount_amount: item.discount_amount || 0
        })
        .select()
        .single();

      if (error) throw error;

      const newItem = data as CartItem;
      setItems(prev => [...prev, newItem]);

      toast({
        title: "Added to cart",
        description: `${item.participant_name} added to cart`
      });

      return newItem;
    } catch (err: any) {
      console.error('Error adding item:', err);
      toast({
        title: "Error",
        description: err.message || "Failed to add item to cart",
        variant: "destructive"
      });
      return null;
    }
  };

  // Remove item from cart
  const removeItem = async (itemId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      setItems(prev => prev.filter(i => i.id !== itemId));

      toast({
        title: "Removed from cart",
        description: "Item removed from cart"
      });

      return true;
    } catch (err: any) {
      console.error('Error removing item:', err);
      toast({
        title: "Error",
        description: "Failed to remove item",
        variant: "destructive"
      });
      return false;
    }
  };

  // Update item in cart
  const updateItem = async (itemId: string, updates: Partial<NewCartItem>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('cart_items')
        .update(updates)
        .eq('id', itemId);

      if (error) throw error;

      setItems(prev => prev.map(i => 
        i.id === itemId ? { ...i, ...updates } as CartItem : i
      ));

      return true;
    } catch (err: any) {
      console.error('Error updating item:', err);
      toast({
        title: "Error",
        description: "Failed to update item",
        variant: "destructive"
      });
      return false;
    }
  };

  // Apply promo code to item
  const applyPromoCode = async (itemId: string, promoCodeId: string, discountAmount: number): Promise<boolean> => {
    return updateItem(itemId, { 
      promo_code_id: promoCodeId, 
      discount_amount: discountAmount 
    });
  };

  // Calculate cart totals
  const calculateTotal = useCallback((): CartSummary => {
    const subtotal = items.reduce((sum, item) => sum + item.base_price, 0);
    const promoDiscounts = items.reduce((sum, item) => sum + (item.discount_amount || 0), 0);
    
    // Find applicable group discount
    let groupDiscount = 0;
    let groupDiscountRule: GroupDiscountRule | null = null;
    
    for (const rule of groupDiscountRules) {
      if (items.length >= rule.min_registrations) {
        groupDiscountRule = rule;
        break;
      }
    }

    if (groupDiscountRule) {
      const afterPromo = subtotal - promoDiscounts;
      if (groupDiscountRule.discount_type === 'percent') {
        groupDiscount = afterPromo * (groupDiscountRule.discount_value / 100);
      } else if (groupDiscountRule.discount_type === 'fixed') {
        groupDiscount = groupDiscountRule.discount_value;
      } else if (groupDiscountRule.discount_type === 'per_person') {
        groupDiscount = groupDiscountRule.discount_value * items.length;
      }
    }

    const total = Math.max(0, subtotal - promoDiscounts - groupDiscount);

    return {
      subtotal,
      promoDiscounts,
      groupDiscount,
      groupDiscountRule,
      total,
      itemCount: items.length
    };
  }, [items, groupDiscountRules]);

  // Clear cart
  const clearCart = async (): Promise<boolean> => {
    if (!cart) return true;

    try {
      const { error } = await supabase
        .from('registration_carts')
        .update({ status: 'expired' })
        .eq('id', cart.id);

      if (error) throw error;

      setCart(null);
      setItems([]);
      return true;
    } catch (err: any) {
      console.error('Error clearing cart:', err);
      return false;
    }
  };

  // Initialize
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  return {
    cart,
    items,
    groupDiscountRules,
    isLoading,
    error,
    addItem,
    removeItem,
    updateItem,
    applyPromoCode,
    calculateTotal,
    clearCart,
    refetch: fetchCart
  };
}
