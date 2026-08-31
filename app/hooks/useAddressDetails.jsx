import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useAddressDetails(addressId) {
  return useQuery({
    queryKey: ['Address', addressId],

    queryFn: async () => {
      const { data, error } = await supabase
        .from('Addresses')
        .select(
          `
          *,
          teams:Teams(
      id,
      display_name,
      abbreviation,
      crest
    )
        `
        )
        .eq('id', addressId)
        .single();

      console.log('Address query:', { data, error });

      if (error) throw error;

      return data;
    },

    staleTime: 5 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    enabled: !!addressId,
  });
}

export default useAddressDetails;
