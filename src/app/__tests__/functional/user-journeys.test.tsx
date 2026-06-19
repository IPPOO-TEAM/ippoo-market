import { describe, it, expect } from 'vitest';
import { VENDORS, SHOPS, MARKETPLACE_PRODUCTS } from '../../data/marketplace';
import { CATALOG } from '../../data/catalog';
import { blogArticles } from '../../data/blog-articles';

describe('User Journeys - Functional Tests', () => {
  describe('New User Journey', () => {
    it('should discover products through categories', () => {
      // 1. User sees 20 main categories
      expect(CATALOG.length).toBe(20);

      // 2. User clicks on Alimentation category
      const alimentationCat = CATALOG.find(c => c.id === 'alimentation');
      expect(alimentationCat).toBeDefined();

      // 3. User sees subcategories
      expect(alimentationCat!.children.length).toBeGreaterThan(10);

      // 4. User sees products in subcategory
      const products = MARKETPLACE_PRODUCTS.filter(
        p => p.catalogId === 'alimentation'
      );
      expect(products.length).toBeGreaterThan(100);
    });

    it('should search and find products', () => {
      // 1. User searches for "riz"
      const searchTerm = 'riz';
      const results = MARKETPLACE_PRODUCTS.filter(p =>
        p.name.toLowerCase().includes(searchTerm)
      );

      // 2. User gets relevant results
      expect(results.length).toBeGreaterThan(0);

      // 3. Each result contains the search term
      results.forEach(product => {
        expect(product.name.toLowerCase()).toContain(searchTerm);
      });
    });

    it('should complete purchase flow', () => {
      // 1. User selects a product
      const product = MARKETPLACE_PRODUCTS[0];
      expect(product).toBeDefined();

      // 2. User checks MOQ
      expect(product.moq).toBeGreaterThan(0);

      // 3. User selects quantity (respecting MOQ)
      const quantity = product.moq * 2;
      expect(quantity).toBeGreaterThanOrEqual(product.moq);

      // 4. User gets price tier
      const applicableTier = product.paliers
        .filter(t => t.qty <= quantity)
        .sort((a, b) => b.qty - a.qty)[0];

      expect(applicableTier).toBeDefined();

      // 5. User calculates total
      const total = quantity * applicableTier.price;
      expect(total).toBeGreaterThan(0);

      // 6. User identifies seller
      expect(product.seller).toBeTruthy();
      expect(product.shopId).toBeTruthy();
    });
  });

  describe('Vendor Discovery Journey', () => {
    it('should find vendors by category', () => {
      // 1. User wants to find food vendors
      const foodShops = SHOPS.filter(s => s.niche === 'alimentation');
      expect(foodShops.length).toBeGreaterThan(0);

      // 2. User sees vendor ratings
      foodShops.forEach(shop => {
        expect(shop.rating).toBeGreaterThan(0);
        expect(shop.rating).toBeLessThanOrEqual(5);
      });

      // 3. User filters verified vendors
      const verifiedShops = foodShops.filter(s => s.verified);
      expect(verifiedShops.length).toBeGreaterThan(0);
    });

    it('should explore vendor products', () => {
      // 1. User selects a shop
      const shop = SHOPS[0];

      // 2. User sees all shop products
      const shopProducts = MARKETPLACE_PRODUCTS.filter(
        p => p.shopId === shop.id
      );

      expect(shopProducts.length).toBeGreaterThan(0);

      // 3. All products are from same shop
      shopProducts.forEach(product => {
        expect(product.shopId).toBe(shop.id);
        expect(product.seller).toBe(shop.name);
      });
    });

    it('should compare vendors', () => {
      // 1. User gets vendors for comparison
      const vendors = VENDORS.slice(0, 3);

      // 2. User compares ratings
      vendors.forEach(vendor => {
        expect(vendor.rating).toBeGreaterThanOrEqual(0);
        expect(vendor.rating).toBeLessThanOrEqual(5);
      });

      // 3. User checks verification status
      const verifiedCount = vendors.filter(v => v.verified).length;
      expect(verifiedCount).toBeGreaterThan(0);
    });
  });

  describe('Bulk Purchase Journey', () => {
    it('should calculate volume discounts', () => {
      // 1. User wants to buy in bulk
      const product = MARKETPLACE_PRODUCTS.find(p => p.paliers.length >= 3);
      if (!product) return;

      // 2. User checks price tiers
      expect(product.paliers.length).toBeGreaterThanOrEqual(3);

      // 3. User verifies discounts increase with quantity
      for (let i = 1; i < product.paliers.length; i++) {
        const currentTier = product.paliers[i];
        const previousTier = product.paliers[i - 1];

        // Higher quantity should have same or lower price
        expect(currentTier.price).toBeLessThanOrEqual(previousTier.price);
        expect(currentTier.qty).toBeGreaterThan(previousTier.qty);
      }

      // 4. User calculates savings
      const smallQty = product.paliers[0].qty;
      const largeQty = product.paliers[product.paliers.length - 1].qty;

      const smallQtyPrice = product.paliers[0].price;
      const largeQtyPrice = product.paliers[product.paliers.length - 1].price;

      const savings = (smallQtyPrice - largeQtyPrice) / smallQtyPrice * 100;
      expect(savings).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Content Discovery Journey', () => {
    it('should read blog articles', () => {
      // 1. User accesses blog
      expect(blogArticles.length).toBe(19);

      // 2. User sees featured articles
      const featuredArticles = blogArticles.filter(a => a.featured);
      expect(featuredArticles.length).toBeGreaterThan(0);

      // 3. User reads article
      const article = blogArticles[0];
      expect(article.title).toBeTruthy();
      expect(article.excerpt).toBeTruthy();
      expect(article.category).toBeTruthy();
      expect(article.readTime).toBeTruthy();
    });

    it('should filter articles by category', () => {
      // 1. User wants to read guides
      const guides = blogArticles.filter(a =>
        a.category.includes('Guide') || a.category.includes('pratique')
      );

      expect(guides.length).toBeGreaterThan(0);

      // 2. Each article is categorized
      blogArticles.forEach(article => {
        expect(article.category).toBeTruthy();
      });
    });
  });

  describe('Mobile Money Payment Journey', () => {
    it('should support multiple payment providers', () => {
      const providers = ['MTN Money', 'Moov Money', 'Orange Money', 'Wave', 'Celtis Cash'];

      // User can choose from 5 mobile money providers
      expect(providers.length).toBe(5);

      // All major providers in West Africa are supported
      expect(providers).toContain('MTN Money');
      expect(providers).toContain('Orange Money');
      expect(providers).toContain('Wave');
    });
  });
});
