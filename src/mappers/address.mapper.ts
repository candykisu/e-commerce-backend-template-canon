import { Address } from '../models/ecommerce.schema';

/**
 * Converts an Address object to a DTO
 */
export const toAddressDto = (address: Address) => {
  return {
    id: address.id,
    userId: address.userId,
    type: address.type,
    firstName: address.firstName,
    lastName: address.lastName,
    company: address.company,
    address1: address.address1,
    address2: address.address2,
    city: address.city,
    state: address.state,
    postalCode: address.postalCode,
    country: address.country,
    phone: address.phone,
    isDefault: address.isDefault,
    createdAt: address.createdAt,
    updatedAt: address.updatedAt,
  };
};

/**
 * Converts an Address object to a formatted string
 */
export const toAddressString = (address: Address): string => {
  const parts = [
    `${address.firstName} ${address.lastName}`,
    address.company,
    address.address1,
    address.address2,
    `${address.city}, ${address.state} ${address.postalCode}`,
    address.country,
  ].filter(Boolean);

  return parts.join('\n');
};

/**
 * Converts an Address object to a minimal DTO (for dropdowns, etc.)
 */
export const toAddressMinimalDto = (address: Address) => {
  return {
    id: address.id,
    type: address.type,
    firstName: address.firstName,
    lastName: address.lastName,
    address1: address.address1,
    city: address.city,
    state: address.state,
    postalCode: address.postalCode,
    country: address.country,
    isDefault: address.isDefault,
  };
};