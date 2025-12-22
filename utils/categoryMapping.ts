/**
 * Category Mapping Utility
 *
 * Provides category derivation logic for listings based on listingType, propertyType, and propertySubType.
 * Categories are DERIVED (not stored in DB) for flexible querying and display.
 */

export type ListingCategory =
  | 'Land For Sale'
  | 'Apartments For Sale'
  | 'Apartment Rentals'
  | 'Commercial Property Rentals'
  | 'Property Rentals'
  | 'Houses For Sale'
  | 'Commercial Properties For Sale'
  | 'Room Rentals'
  | 'House Rentals'
  | 'Land Rentals'
  | 'Other Properties';

interface CategoryInput {
  listingType: 'sale' | 'rent';
  propertyType: string;
  propertySubType?: string;
}

/**
 * Derives the category for a listing based on its type and subtype
 * @param listing - Object containing listingType, propertyType, and optional propertySubType
 * @returns The derived category string
 */
export function deriveCategory(listing: CategoryInput): ListingCategory {
  const { listingType, propertyType, propertySubType } = listing;

  // SALE CATEGORIES
  if (listingType === 'sale') {
    if (propertyType === 'land') {
      return 'Land For Sale';
    }
    if (propertyType === 'apartment') {
      return 'Apartments For Sale';
    }
    if (propertyType === 'house') {
      return 'Houses For Sale';
    }
    if (['commercial', 'office', 'shop'].includes(propertyType)) {
      return 'Commercial Properties For Sale';
    }
  }

  // RENT CATEGORIES
  if (listingType === 'rent') {
    if (propertyType === 'land') {
      return 'Land Rentals';
    }
    if (propertyType === 'house') {
      return 'House Rentals';
    }
    if (propertyType === 'apartment') {
      // Special case: Room Rentals
      if (propertySubType?.toLowerCase().includes('room')) {
        return 'Room Rentals';
      }
      return 'Apartment Rentals';
    }
    if (propertyType === 'flat') {
      return 'Property Rentals';
    }
    if (['commercial', 'office', 'shop'].includes(propertyType)) {
      return 'Commercial Property Rentals';
    }
  }

  // Fallback for unmatched combinations
  return 'Other Properties';
}

/**
 * Reverse mapping: Get filter criteria from a category
 * Used for filtering listings by user-selected category
 * @param category - The category to map to filter criteria
 * @returns Filter object with listingType and/or propertyType
 */
export function getCategoryFilters(category: ListingCategory): Partial<CategoryInput> {
  const mapping: Record<ListingCategory, Partial<CategoryInput>> = {
    'Land For Sale': { listingType: 'sale', propertyType: 'land' },
    'Apartments For Sale': { listingType: 'sale', propertyType: 'apartment' },
    'Apartment Rentals': { listingType: 'rent', propertyType: 'apartment' },
    'Commercial Property Rentals': { listingType: 'rent' }, // Multiple property types
    'Property Rentals': { listingType: 'rent', propertyType: 'flat' },
    'Houses For Sale': { listingType: 'sale', propertyType: 'house' },
    'Commercial Properties For Sale': { listingType: 'sale' }, // Multiple property types
    'Room Rentals': { listingType: 'rent', propertyType: 'apartment' }, // Note: propertySubType filter handled separately
    'House Rentals': { listingType: 'rent', propertyType: 'house' },
    'Land Rentals': { listingType: 'rent', propertyType: 'land' },
    'Other Properties': {},
  };

  return mapping[category] || {};
}

/**
 * Get all available categories
 * @returns Array of all listing categories
 */
export function getAllCategories(): ListingCategory[] {
  return [
    'Land For Sale',
    'Apartments For Sale',
    'Apartment Rentals',
    'Commercial Property Rentals',
    'Property Rentals',
    'Houses For Sale',
    'Commercial Properties For Sale',
    'Room Rentals',
    'House Rentals',
    'Land Rentals',
  ];
}

/**
 * Check if a category requires commercial property types
 * @param category - The category to check
 * @returns True if the category is for commercial properties
 */
export function isCommercialCategory(category: ListingCategory): boolean {
  return category === 'Commercial Properties For Sale' ||
         category === 'Commercial Property Rentals';
}
