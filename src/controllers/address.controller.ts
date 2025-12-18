import { Request, Response } from 'express';
import * as addressService from '../services/address.service';
import { toAddressDto } from '../mappers/address.mapper';
import { CreateAddressInput, UpdateAddressInput } from '../schemas/address.schema';
import { asyncHandler } from '../utils/asyncHandler';
import { success as successMessages } from '../constants/messages';
import { sendSuccessResponse } from '../utils/responseHandler';

/**
 * Create a new address
 */
export const createAddress = asyncHandler(
  async (req: Request<object, object, CreateAddressInput>, res: Response): Promise<void> => {
    const address = await addressService.createAddress(req.body);
    const addressDto = toAddressDto(address);

    sendSuccessResponse(res, 201, successMessages.CREATED('Address'), addressDto);
  }
);

/**
 * Get addresses for a user
 */
export const getUserAddresses = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;
  const type = req.query.type as string;

  const addresses = await addressService.getUserAddresses(userId, type);
  const addressesDto = addresses.map(toAddressDto);

  sendSuccessResponse(res, 200, successMessages.FETCHED('Addresses'), addressesDto);
});

/**
 * Get address by ID
 */
export const getAddressById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const address = await addressService.getAddressById(id);
  const addressDto = toAddressDto(address);

  sendSuccessResponse(res, 200, successMessages.FETCHED('Address'), addressDto);
});

/**
 * Get user's address by ID (ensures ownership)
 */
export const getUserAddressById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { userId, id } = req.params;
  const address = await addressService.getUserAddressById(userId, id);
  const addressDto = toAddressDto(address);

  sendSuccessResponse(res, 200, successMessages.FETCHED('Address'), addressDto);
});

/**
 * Update address
 */
export const updateAddress = asyncHandler(
  async (req: Request<{ userId: string; id: string }, object, UpdateAddressInput>, res: Response): Promise<void> => {
    const { userId, id } = req.params;
    const address = await addressService.updateAddress(userId, id, req.body);
    const addressDto = toAddressDto(address);

    sendSuccessResponse(res, 200, successMessages.UPDATED('Address'), addressDto);
  }
);

/**
 * Delete address
 */
export const deleteAddress = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { userId, id } = req.params;
  await addressService.deleteAddress(userId, id);
  res.status(204).send();
});

/**
 * Set address as default
 */
export const setDefaultAddress = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { userId, id } = req.params;
  const { type } = req.body;

  if (!type || !['billing', 'shipping'].includes(type)) {
    res.status(400).json({ message: 'Valid address type (billing or shipping) is required' });
    return;
  }

  await addressService.setDefaultAddress(userId, id, type);
  sendSuccessResponse(res, 200, 'Address set as default successfully');
});

/**
 * Get default address
 */
export const getDefaultAddress = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;
  const { type } = req.query;

  if (!type || !['billing', 'shipping'].includes(type as string)) {
    res.status(400).json({ message: 'Valid address type (billing or shipping) is required' });
    return;
  }

  const address = await addressService.getDefaultAddress(userId, type as string);
  
  if (!address) {
    res.status(404).json({ message: 'No default address found' });
    return;
  }

  const addressDto = toAddressDto(address);
  sendSuccessResponse(res, 200, successMessages.FETCHED('Default address'), addressDto);
});

/**
 * Get shipping addresses for a user
 */
export const getShippingAddresses = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;
  const addresses = await addressService.getShippingAddresses(userId);
  const addressesDto = addresses.map(toAddressDto);

  sendSuccessResponse(res, 200, successMessages.FETCHED('Shipping addresses'), addressesDto);
});

/**
 * Get billing addresses for a user
 */
export const getBillingAddresses = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;
  const addresses = await addressService.getBillingAddresses(userId);
  const addressesDto = addresses.map(toAddressDto);

  sendSuccessResponse(res, 200, successMessages.FETCHED('Billing addresses'), addressesDto);
});