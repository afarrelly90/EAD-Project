import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class FavoritesService {
  private readonly storageKey = 'favorite-exercise-ids';

  getFavoriteIds(): number[] {
    const storedIds = localStorage.getItem(this.storageKey);
    if (!storedIds) {
      return [];
    }

    try {
      const parsedIds = JSON.parse(storedIds) as unknown;
      if (!Array.isArray(parsedIds)) {
        return [];
      }

      return parsedIds
        .map((id) => Number(id))
        .filter((id) => Number.isInteger(id) && id > 0);
    } catch {
      return [];
    }
  }

  isFavorite(exerciseId: number): boolean {
    return this.getFavoriteIds().includes(exerciseId);
  }

  toggleFavorite(exerciseId: number): boolean {
    const favorites = new Set(this.getFavoriteIds());

    if (favorites.has(exerciseId)) {
      favorites.delete(exerciseId);
    } else {
      favorites.add(exerciseId);
    }

    const nextFavorites = Array.from(favorites).sort((left, right) => left - right);
    localStorage.setItem(this.storageKey, JSON.stringify(nextFavorites));
    return nextFavorites.includes(exerciseId);
  }
}
