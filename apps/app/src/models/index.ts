import type { User } from './User';

export * as UserModel from './User';
export * as RefreshTokenModel from './RefreshToken';
export * as RestaurantModel from './Restaurant';
export * as CategoryModel from './Category';
export * as FoodModel from './Food';
export * as RestaurantHoursModel from './RestaurantHours';
export * as RestaurantImageModel from './RestaurantImage';
export * as ReviewModel from './Review';
export type { User, Role } from './User';
export type { RefreshToken } from './RefreshToken';
export type { Restaurant, RestaurantStatus } from './Restaurant';
export type { Category } from './Category';
export type { Food } from './Food';
export type { RestaurantHours, DayOfWeek } from './RestaurantHours';
export type {
  RestaurantImage,
  RestaurantImageType,
  SingletonImageType,
  GalleryImageType,
} from './RestaurantImage';
export type { Review } from './Review';

export type SafeUser = Omit<User, 'passwordHash'>;

export function toSafeUser(user: User): SafeUser {
  const { passwordHash, ...safe } = user;
  return safe;
}
