import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { executeQuery, executeMutation, GraphQLOperation } from '../lib/graphql-client';

// Hook para queries GraphQL
export function useGraphQLQuery<T = any>(
  queryKey: string[],
  operation: GraphQLOperation,
  options?: {
    enabled?: boolean;
    staleTime?: number;
    refetchInterval?: number;
  }
) {
  return useQuery({
    queryKey,
    queryFn: () => executeQuery<T>(operation),
    enabled: options?.enabled ?? true,
    staleTime: options?.staleTime,
    refetchInterval: options?.refetchInterval,
  });
}

// Hook para mutations GraphQL
export function useGraphQLMutation<TData = any, TVariables = any>(
  operation: (variables: TVariables) => GraphQLOperation,
  options?: {
    onSuccess?: (data: TData) => void;
    onError?: (error: Error) => void;
    invalidateQueries?: string[][];
  }
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: TVariables) => 
      executeMutation<TData>(operation(variables)),
    onSuccess: (data) => {
      // Invalidar queries relacionadas
      if (options?.invalidateQueries) {
        options.invalidateQueries.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey });
        });
      }
      options?.onSuccess?.(data);
    },
    onError: options?.onError,
  });
}
