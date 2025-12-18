import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from '../db';
import { addresses, NewAddress } from '../models/ecommerce.schema';
import { logger } from '../utils';
import { CreateAddressInput, UpdateAddressInput } from '../schemas/address.schema';

export const create = async (addressData: CreateAddressInput): Promise<typeof addresses.$inferSelect> => {
  try {
    logger.info('Creating new address in repository', { 
      userId: addressData.userId, 
      type: addressData.type 
    });

    // If this is set as default, unset other default addresses of the same type for this user
    if (addressData.isDefault) {
      await db
        .update(addresses)
        .set({ isDefault: false })
        .where(and(
          eq(addresses.userId, addressData.userId),
          eq(addresses.type, addressData.type)
        ));
    }

    const newAddress: NewAddress = {
      userId: addressData.userId,
      type: addressData.type,
      firstName: addressData.firstName,
      lastName: addressData.lastName,
      company: addressData.company,
      address1: addressData.address1,
      address2: addressData.address2,
      city: addressData.city,
      state: addressData.state,
      postalCode: addressData.postalCode,
      country: addressData.country,
      phone: addressData.phone,
      isDefault: addressData.isDefault,
    };

    const [savedAddress] = await db.insert(addresses).values(newAddress).returning();

    logger.info('Address created successfully in repository', { addressId: savedAddress.id });
    return savedAddress;
  } catch (error) {
    logger.error('Error creating address in repository:', error);
    throw error;
  }
};

export const findByUserId = async (
  userId: string,
  type?: string
): Promise<typeof addresses.$inferSelect[]> => {
  try {
    const conditions = [eq(addresses.userId, userId)];
    if (type) {
      conditions.push(eq(addresses.type, type));
    }

    const userAddresses = await db
      .select()
      .from(addresses)
      .where(and(...conditions))
      .orderBy(desc(addresses.isDefault), desc(addresses.createdAt));

    logger.info('Addresses retrieved successfully from repository', {
      userId,
      count: userAddresses.length,
    });
    return userAddresses;
  } catch (error) {
    logger.error('Error retrieving addresses from repository:', error);
    throw error;
  }
};

export const findById = async (addressId: number): Promise<typeof addresses.$inferSelect | null> => {
  try {
    const [address] = await db
      .select()
      .from(addresses)
      .where(eq(addresses.id, addressId));

    if (!address) {
      logger.warn('Address not found in repository', { addressId });
      return null;
    }

    logger.info('Address retrieved successfully from repository', { addressId });
    return address;
  } catch (error) {
    logger.error('Error retrieving address from repository:', error);
    throw error;
  }
};

export const findByUserIdAndId = async (
  userId: string,
  addressId: number
): Promise<typeof addresses.$inferSelect | null> => {
  try {
    const [address] = await db
      .select()
      .from(addresses)
      .where(and(
        eq(addresses.id, addressId),
        eq(addresses.userId, userId)
      ));

    return address || null;
  } catch (error) {
    logger.error('Error finding address by user and ID:', error);
    throw error;
  }
};

export const update = async (
  addressId: number,
  userId: string,
  updateData: UpdateAddressInput
): Promise<typeof addresses.$inferSelect | null> => {
  try {
    // If setting as default, unset other default addresses of the same type for this user
    if (updateData.isDefault && updateData.type) {
      await db
        .update(addresses)
        .set({ isDefault: false })
        .where(and(
          eq(addresses.userId, userId),
          eq(addresses.type, updateData.type)
        ));
    }

    const updateValues: Partial<NewAddress> = {
      ...updateData,
      updatedAt: new Date(),
    };

    const [address] = await db
      .update(addresses)
      .set(updateValues)
      .where(and(
        eq(addresses.id, addressId),
        eq(addresses.userId, userId)
      ))
      .returning();

    if (!address) {
      logger.warn('Address not found for update in repository', { addressId, userId });
      return null;
    }

    logger.info('Address updated successfully in repository', { addressId });
    return address;
  } catch (error) {
    logger.error('Error updating address in repository:', error);
    throw error;
  }
};

export const remove = async (addressId: number, userId: string): Promise<boolean> => {
  try {
    const [address] = await db
      .delete(addresses)
      .where(and(
        eq(addresses.id, addressId),
        eq(addresses.userId, userId)
      ))
      .returning({ id: addresses.id });

    if (!address) {
      logger.warn('Address not found for deletion in repository', { addressId, userId });
      return false;
    }

    logger.info('Address deleted successfully in repository', { addressId });
    return true;
  } catch (error) {
    logger.error('Error deleting address in repository:', error);
    throw error;
  }
};

export const setAsDefault = async (
  addressId: number,
  userId: string,
  type: string
): Promise<boolean> => {
  try {
    // First, unset all default addresses of this type for the user
    await db
      .update(addresses)
      .set({ isDefault: false })
      .where(and(
        eq(addresses.userId, userId),
        eq(addresses.type, type)
      ));

    // Then set the specified address as default
    const [address] = await db
      .update(addresses)
      .set({ isDefault: true, updatedAt: new Date() })
      .where(and(
        eq(addresses.id, addressId),
        eq(addresses.userId, userId),
        eq(addresses.type, type)
      ))
      .returning({ id: addresses.id });

    if (!address) {
      logger.warn('Address not found for setting as default', { addressId, userId });
      return false;
    }

    logger.info('Address set as default successfully', { addressId, userId, type });
    return true;
  } catch (error) {
    logger.error('Error setting address as default:', error);
    throw error;
  }
};

export const getDefaultAddress = async (
  userId: string,
  type: string
): Promise<typeof addresses.$inferSelect | null> => {
  try {
    const [address] = await db
      .select()
      .from(addresses)
      .where(and(
        eq(addresses.userId, userId),
        eq(addresses.type, type),
        eq(addresses.isDefault, true)
      ));

    return address || null;
  } catch (error) {
    logger.error('Error getting default address:', error);
    throw error;
  }
};