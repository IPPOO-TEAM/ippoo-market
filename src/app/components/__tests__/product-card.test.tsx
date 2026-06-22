import { describe, it, expect } from 'vitest';
import { render, screen } from '../../../test/test-utils';
import { ProductCard } from '../product-card';

describe('ProductCard', () => {
  const mockProduct = {
    id: 1,
    name: 'Riz Parfumé 25kg',
    image: 'https://example.com/rice.jpg',
    price: 14800,
    moq: 10,
    unit: 'sacs',
    seller: 'Ets Ahouandjinou',
    rating: 4.8,
    category: 'Alimentaire',
    inStock: true,
  };

  it('should render the product name', () => {
    render(<ProductCard {...mockProduct} />);
    expect(screen.getByText('Riz Parfumé 25kg')).toBeInTheDocument();
  });

  it('should display MOQ + unit', () => {
    render(<ProductCard {...mockProduct} />);
    expect(screen.getByText(/Min\.\s*10\s*sacs/i)).toBeInTheDocument();
  });

  it('should display rating', () => {
    render(<ProductCard {...mockProduct} />);
    // Le composant rend 4.8 (en-tête) et 4.8 (badge bas) - getAllByText pour tolérer les deux.
    expect(screen.getAllByText(/4\.8/).length).toBeGreaterThan(0);
  });

  it('should show out-of-stock indicator', () => {
    render(<ProductCard {...mockProduct} inStock={false} />);
    expect(screen.getByText(/Rupture/i)).toBeInTheDocument();
  });

  it('should render the order CTA', () => {
    render(<ProductCard {...mockProduct} />);
    expect(screen.getByRole('button', { name: /Commander/i })).toBeInTheDocument();
  });
});
