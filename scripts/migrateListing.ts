/**
 * Migration Script for Listing Schema Update
 *
 * This script migrates existing listing data to align with the new schema:
 * - Renames priceType to listingType
 * - Removes deprecated Bangladesh-specific fields
 * - Converts liftCount to liftAvailable boolean
 * - Sets defaults for new fields
 * - Auto-computes pricePerSqft where missing
 */

import mongoose from 'mongoose';
import { ListingModel } from '../models/Listing.model.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/zivio-living';

async function migrateListing() {
  console.log('🚀 Starting listing migration...\n');

  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all listings
    const listings = await ListingModel.find({});
    console.log(`📊 Found ${listings.length} listings to migrate\n`);

    let migratedCount = 0;
    let skippedCount = 0;
    const errors: Array<{ id: string; error: string }> = [];

    for (const listing of listings) {
      try {
        let updated = false;

        // Rename priceType to listingType
        if ((listing as any).priceType && !listing.listingType) {
          listing.listingType = (listing as any).priceType;
          updated = true;
        }

        // Remove deprecated fields
        const deprecatedFields = [
          'landSizeKatha',
          'developerTier',
          'buildingYear',
          'totalUnitsInBuilding',
          'liftCount'
        ];

        deprecatedFields.forEach(field => {
          if ((listing as any)[field] !== undefined) {
            // Convert liftCount to liftAvailable before removing
            if (field === 'liftCount' && (listing as any).liftCount !== undefined) {
              listing.liftAvailable = (listing as any).liftCount > 0;
            }
            (listing as any)[field] = undefined;
            updated = true;
          }
        });

        // Set defaults for new Boolean fields if not already set
        const booleanDefaults: Record<string, boolean> = {
          negotiable: false,
          security24x7: false,
          cctv: false,
          generatorBackup: false,
          fireSafety: false,
          liftAvailable: listing.liftAvailable ?? false,
          isPhoneHidden: false,
          whatsappEnabled: false,
          chatEnabled: true,
        };

        Object.entries(booleanDefaults).forEach(([field, defaultValue]) => {
          if ((listing as any)[field] === undefined) {
            (listing as any)[field] = defaultValue;
            updated = true;
          }
        });

        // Set default for reportCount
        if (listing.reportCount === undefined) {
          listing.reportCount = 0;
          updated = true;
        }

        // Auto-compute pricePerSqft if missing
        if (!listing.pricePerSqft && listing.price && listing.areaSqFt && listing.areaSqFt > 0) {
          listing.pricePerSqft = Math.round(listing.price / listing.areaSqFt);
          updated = true;
        }

        // Save if any changes were made
        if (updated) {
          await listing.save();
          migratedCount++;
          console.log(`✅ Migrated listing: ${listing.id} - ${listing.title}`);
        } else {
          skippedCount++;
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push({
          id: listing.id,
          error: errorMessage
        });
        console.error(`❌ Error migrating listing ${listing.id}:`, errorMessage);
      }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📈 Migration Summary:');
    console.log('='.repeat(50));
    console.log(`Total listings:     ${listings.length}`);
    console.log(`✅ Migrated:        ${migratedCount}`);
    console.log(`⏭️  Skipped:         ${skippedCount}`);
    console.log(`❌ Errors:          ${errors.length}`);

    if (errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      errors.forEach(({ id, error }) => {
        console.log(`  - ${id}: ${error}`);
      });
    }

    console.log('\n✨ Migration completed successfully!');

  } catch (error) {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

// Run migration
migrateListing()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
