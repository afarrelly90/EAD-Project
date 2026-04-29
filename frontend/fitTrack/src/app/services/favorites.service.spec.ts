import { FavoritesService } from './favorites.service';

describe('FavoritesService', () => {
  let service: FavoritesService;

  beforeEach(() => {
    localStorage.clear();
    service = new FavoritesService();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should return an empty list when there are no saved favorites', () => {
    expect(service.getFavoriteIds()).toEqual([]);
  });

  it('should add and remove favorites from local storage', () => {
    expect(service.toggleFavorite(3)).toBeTrue();
    expect(service.getFavoriteIds()).toEqual([3]);
    expect(service.isFavorite(3)).toBeTrue();

    expect(service.toggleFavorite(3)).toBeFalse();
    expect(service.getFavoriteIds()).toEqual([]);
    expect(service.isFavorite(3)).toBeFalse();
  });

  it('should ignore invalid saved values', () => {
    localStorage.setItem('favorite-exercise-ids', JSON.stringify(['a', -2, 4, 0, 7.3, 9]));

    expect(service.getFavoriteIds()).toEqual([4, 9]);
  });
});
