import { describe, it, expect, vi } from 'vitest';
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

  it('should render product information correctly', () => {
    render(<ProductCard product={mockProduct} />);

    expect(screen.getByText('Riz Parfumé 25kg')).toBeInTheDocument();
    expect(screen.getByText('Ets Ahouandjinou')).toBeInTheDocument();
    expect(screen.getByText(/14[,\s]?800/)).toBeInTheDocument();
  });

  it('should display MOQ information', () => {
    render(<ProductCard product={mockProduct} />);

    expect(screen.getByText(/10/)).toBeInTheDocument();
    expect(screen.getByText(/sacs/)).toBeInTheDocument();
  });

  it('should show rating', () => {
    render(<ProductCard product={mockProduct} />);

    expect(screen.getByText('4.8')).toBeInTheDocument();
  });

  it('should handle out of stock products', () => {
    const outOfStockProduct = { ...mockProduct, inStock: false };
    render(<ProductCard product={outOfStockProduct} />);

    // Vérifie qu'un indicateur de stock est présent
    expect(screen.getByText(/stock/i) || screen.getByText(/épuisé/i) || screen.getByText(/indisponible/i)).toBeInTheDocument();
  });

  it('should call onClick when clicking the card', () => {
    const handleClick = vi.fn();
    render(<ProductCard product={mockProduct} onClick={handleClick} />);

    const card = screen.getByText('Riz Parfumé 25kg').closest('button') ||
                 screen.getByText('Riz Parfumé 25kg').closest('div');
    if (card) {
      card.click();
      expect(handleClick).toHaveBeenCalledTimes(1);
    }
  });
});
