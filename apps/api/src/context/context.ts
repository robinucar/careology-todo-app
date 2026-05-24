export type GraphQLContext = {
  requestId: string;
};

export const createContext = async (): Promise<GraphQLContext> => {
  return {
    requestId: crypto.randomUUID(),
  };
};