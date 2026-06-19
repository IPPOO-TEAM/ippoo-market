import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../../test/test-utils';
import { CATALOG } from '../../data/catalog';
import { catalogIdForMainCategory } from '../../data/product-catalog-link';

describe('Catalog Navigation Integration', () => {
  describe('Catalog Structure', () => {
    it('should have 20 main categories', () => {
      expect(CATALOG).toHaveLength(20);
    });

    it('should have complete category data', () => {
      CATALOG.forEach(category => {
        expect(category).toHaveProperty('id');
        expect(category).toHaveProperty('code');
        expect(category).toHaveProperty('icon');
        expect(category).toHaveProperty('name');
        expect(category).toHaveProperty('color');
        expect(category).toHaveProperty('children');

        expect(category.children).toBeInstanceOf(Array);
        expect(category.children.length).toBeGreaterThan(0);
      });
    });

    it('should have subcategories with products', () => {
      const alimentationCategory = CATALOG.find(c => c.id === 'alimentation');
      expect(alimentationCategory).toBeDefined();
      expect(alimentationCategory!.children.length).toBeGreaterThan(10);

      // Vérifie que les sous-catégories ont des items
      const firstSub = alimentationCategory!.children[0];
      expect(firstSub).toHaveProperty('name');
      if (firstSub.children) {
        expect(firstSub.children.length).toBeGreaterThan(0);
      }
    });

    it('should link main categories to catalog IDs correctly', () => {
      const alimentaireId = catalogIdForMainCategory('Alimentaire');
      expect(alimentaireId).toBe('alimentation');

      const electronicsId = catalogIdForMainCategory('Électronique');
      expect(electronicsId).toBe('electronique');

      const textileId = catalogIdForMainCategory('Textile');
      expect(textileId).toBe('mode-femme');
    });

    it('should have images for categories', () => {
      CATALOG.forEach(category => {
        // Vérifie que soit la catégorie soit ses enfants ont des images
        const hasImage = category.image || category.children.some(child => child.image);
        expect(hasImage).toBeTruthy();
      });
    });
  });

  describe('Subcategory Navigation', () => {
    it('should navigate through category hierarchy', () => {
      const category = CATALOG[0];
      expect(category.children.length).toBeGreaterThan(0);

      const subcategory = category.children[0];
      expect(subcategory.name).toBeTruthy();

      if (subcategory.children && subcategory.children.length > 0) {
        const item = subcategory.children[0];
        expect(item.name).toBeTruthy();
      }
    });

    it('should have at least 240 total subcategories', () => {
      let totalSubcategories = 0;

      CATALOG.forEach(category => {
        // Compte les sous-catégories de niveau 2
        totalSubcategories += category.children.length;

        // Compte les sous-catégories de niveau 3+
        category.children.forEach(sub => {
          if (sub.children) {
            totalSubcategories += sub.children.length;
          }
        });
      });

      expect(totalSubcategories).toBeGreaterThanOrEqual(240);
    });
  });
});
