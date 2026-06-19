import { describe, it, expect } from 'vitest';
import { VENDORS, SHOPS, MARKETPLACE_PRODUCTS, findShop, shopsForVendor, shopsForNiche } from '../marketplace';

describe('Marketplace Data', () => {
  describe('VENDORS', () => {
    it('should have 37 vendors', () => {
      expect(VENDORS).toHaveLength(37);
    });

    it('should have all required vendor fields', () => {
      VENDORS.forEach(vendor => {
        expect(vendor).toHaveProperty('id');
        expect(vendor).toHaveProperty('name');
        expect(vendor).toHaveProperty('city');
        expect(vendor).toHaveProperty('rating');
        expect(vendor).toHaveProperty('verified');
        expect(vendor).toHaveProperty('joined');

        expect(typeof vendor.id).toBe('string');
        expect(typeof vendor.name).toBe('string');
        expect(vendor.rating).toBeGreaterThanOrEqual(0);
        expect(vendor.rating).toBeLessThanOrEqual(5);
      });
    });

    it('should have verified vendors', () => {
      const verifiedVendors = VENDORS.filter(v => v.verified);
      expect(verifiedVendors.length).toBeGreaterThan(20);
    });

    it('should have unique vendor IDs', () => {
      const ids = VENDORS.map(v => v.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(VENDORS.length);
    });
  });

  describe('SHOPS', () => {
    it('should have at least 25 shops', () => {
      expect(SHOPS.length).toBeGreaterThanOrEqual(25);
    });

    it('should have all required shop fields', () => {
      SHOPS.forEach(shop => {
        expect(shop).toHaveProperty('id');
        expect(shop).toHaveProperty('vendorId');
        expect(shop).toHaveProperty('name');
        expect(shop).toHaveProperty('niche');
        expect(shop).toHaveProperty('nicheName');
        expect(shop).toHaveProperty('city');
        expect(shop).toHaveProperty('rating');
        expect(shop).toHaveProperty('verified');
      });
    });

    it('should link to existing vendors', () => {
      const vendorIds = new Set(VENDORS.map(v => v.id));
      SHOPS.forEach(shop => {
        expect(vendorIds.has(shop.vendorId)).toBe(true);
      });
    });

    it('should have unique shop IDs', () => {
      const ids = SHOPS.map(s => s.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(SHOPS.length);
    });
  });

  describe('MARKETPLACE_PRODUCTS', () => {
    it('should have approximately 4800 products', () => {
      expect(MARKETPLACE_PRODUCTS.length).toBeGreaterThan(4000);
      expect(MARKETPLACE_PRODUCTS.length).toBeLessThan(8000); // Adjusted for 37 vendors
    });

    it('should have all required product fields', () => {
      const sample = MARKETPLACE_PRODUCTS.slice(0, 10);
      sample.forEach(product => {
        expect(product).toHaveProperty('id');
        expect(product).toHaveProperty('name');
        expect(product).toHaveProperty('price');
        expect(product).toHaveProperty('moq');
        expect(product).toHaveProperty('seller');
        expect(product).toHaveProperty('shopId');
        expect(product).toHaveProperty('catalogId');
        expect(product).toHaveProperty('subcategory');

        expect(product.price).toBeGreaterThan(0);
        expect(product.moq).toBeGreaterThan(0);
      });
    });

    it('should link products to existing shops', () => {
      const shopIds = new Set(SHOPS.map(s => s.id));
      const sample = MARKETPLACE_PRODUCTS.slice(0, 100);
      sample.forEach(product => {
        expect(shopIds.has(product.shopId)).toBe(true);
      });
    });

    it('should have price tiers (paliers)', () => {
      const sample = MARKETPLACE_PRODUCTS.slice(0, 10);
      sample.forEach(product => {
        expect(product.paliers).toBeInstanceOf(Array);
        expect(product.paliers.length).toBeGreaterThan(0);
        product.paliers.forEach(tier => {
          expect(tier).toHaveProperty('qty');
          expect(tier).toHaveProperty('price');
        });
      });
    });
  });

  describe('Marketplace Functions', () => {
    it('findShop should return correct shop', () => {
      const shopId = SHOPS[0].id;
      const shop = findShop(shopId);
      expect(shop).toBeDefined();
      expect(shop?.id).toBe(shopId);
    });

    it('findShop should return undefined for non-existent shop', () => {
      const shop = findShop('non-existent-id');
      expect(shop).toBeUndefined();
    });

    it('shopsForVendor should return vendor shops', () => {
      const vendorId = VENDORS[0].id;
      const shops = shopsForVendor(vendorId);
      expect(shops).toBeInstanceOf(Array);
      shops.forEach(shop => {
        expect(shop.vendorId).toBe(vendorId);
      });
    });

    it('shopsForNiche should return shops in same niche', () => {
      const niche = 'alimentation';
      const shops = shopsForNiche(niche);
      expect(shops.length).toBeGreaterThan(0);
      shops.forEach(shop => {
        expect(shop.niche).toBe(niche);
      });
    });
  });
});
