
export type Dog = {
  id: number;
  name: string;
  active: boolean;
};

export type DogWithoutId = Omit<Dog, 'id'>;

export const dogValidator = (data: any) => {
  if (typeof data !== 'object' || data === null) return null;
  if (typeof data.name !== 'string') return null;
  if (typeof data.active !== 'boolean') return null;
  return data as DogWithoutId;
}