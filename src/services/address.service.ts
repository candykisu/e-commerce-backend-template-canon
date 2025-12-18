import { Address } from '../models/ecommerce.schema';
import * as addressRepository from '../repositories/address.repository';
import * as userRepository from '../repositories/user.repository';
import { CreateAddressInput, UpdateAddressInput } from '../schemas/address.schema';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/ApiError';
import { error as errorMessages } from '../constants/messages';

/**
 * Create a new address
 */
export const createAddress = async (addressData: CreateAddressInput): Promise<Address> => {
  // Verify user exists
  const user = await userRepository.findById(addressData.userId);
  if (!user) {
    throw new BadRequestError('User not found');
  }

  return addressRepository.create(addressData);
};

/**
 * Get addresses for a user
 */
export const getUserAddresses = async (
  userId: string,
  type?: string
): Promise<Address[]> => {
  // Verify user exists
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new NotFoundError(errorMessages.NOT_FOUND('User'));
  }

  return addressRepository.findByUserId(userId, type);
};

/**
 * Get address by ID
 */
export const getAddressById = async (addressId: string): Promise<Address> => {
  const id = parseInt(addressId);
  if (isNaN(id)) {
    throw new BadRequestError(errorMessages.INVALID_ID('Address'));
  }

  const address = await addressRepository.findById(id);
  if (!address) {
    throw new NotFoundError(errorMessages.NOT_FOUND('Address'));
  }
  return address;
};

/**
 * Get user's address by ID (ensures ownership)
 */
export const getUserAddressById = async (
  userId: string,
  addressId: string
): Promise<Address> => {
  const id = parseInt(addressId);
  if (isNaN(id)) {
    throw new BadRequestError(errorMessages.INVALID_ID('Address'));
  }

  const address = await addressRepository.findByUserIdAndId(userId, id);
  if (!address) {
    throw new NotFoundError(errorMessages.NOT_FOUND('Address'));
  }
  return address;
};

/**
 * Update address
 */
export const updateAddress = async (
  userId: string,
  addressId: string,
  updateData: UpdateAddressInput
): Promise<Address> => {
  const id = parseInt(addressId);
  if (isNaN(id)) {
    throw new BadRequestError(errorMessages.INVALID_ID('Address'));
  }

  // Verify user owns this address
  const existingAddress = await addressRepository.findByUserIdAndId(userId, id);
  if (!existingAddress) {
    throw new NotFoundError(errorMessages.NOT_FOUND('Address'));
  }

  const address = await addressRepository.update(id, userId, updateData);
  if (!address) {
    throw new NotFoundError(errorMessages.NOT_FOUND('Address'));
  }
  return address;
};

/**
 * Delete address
 */
export const deleteAddress = async (
  userId: string,
  addressId: string
): Promise<boolean> => {
  const id = parseInt(addressId);
  if (isNaN(id)) {
    throw new BadRequestError(errorMessages.INVALID_ID('Address'));
  }

  // Verify user owns this address
  const existingAddress = await addressRepository.findByUserIdAndId(userId, id);
  if (!existingAddress) {
    throw new NotFoundError(errorMessages.NOT_FOUND('Address'));
  }

  const success = await addressRepository.remove(id, userId);
  if (!success) {
    throw new NotFoundError(errorMessages.NOT_FOUND('Address'));
  }
  return true;
};

/**
 * Set address as default
 */
export const setDefaultAddress = async (
  userId: string,
  addressId: string,
  type: string
): Promise<boolean> => {
  const id = parseInt(addressId);
  if (isNaN(id)) {
    throw new BadRequestError(errorMessages.INVALID_ID('Address'));
  }

  if (!['billing', 'shipping'].includes(type)) {
    throw new BadRequestError('Invalid address type');
  }

  // Verify user owns this address and it's the correct type
  const existingAddress = await addressRepository.findByUserIdAndId(userId, id);
  if (!existingAddress) {
    throw new NotFoundError(errorMessages.NOT_FOUND('Address'));
  }

  if (existingAddress.type !== type) {
    throw new BadRequestError('Address type mismatch');
  }

  const success = await addressRepository.setAsDefault(id, userId, type);
  if (!success) {
    throw new NotFoundError(errorMessages.NOT_FOUND('Address'));
  }
  return true;
};

/**
 * Get default address
 */
export const getDefaultAddress = async (
  userId: string,
  type: string
): Promise<Address | null> => {
  if (!['billing', 'shipping'].includes(type)) {
    throw new BadRequestError('Invalid address type');
  }

  // Verify user exists
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new NotFoundError(errorMessages.NOT_FOUND('User'));
  }

  return addressRepository.getDefaultAddress(userId, type);
};

/**
 * Get shipping addresses for a user
 */
export const getShippingAddresses = async (userId: string): Promise<Address[]> => {
  return getUserAddresses(userId, 'shipping');
};

/**
 * Get billing addresses for a user
 */
export const getBillingAddresses = async (userId: string): Promise<Address[]> => {
  return getUserAddresses(userId, 'billing');
};