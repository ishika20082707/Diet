import { NextFunction, Router, Request, Response } from 'express';
import { Ingredient } from '../models/Ingredient.ts';
import { authorize, protect } from '../middleware/auth.ts';

const router = Router();

// GET /api/ingredients
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, availableOnly } = req.query;
    const query: Record<string, unknown> = {};

    if (category && category !== 'all') query.category = category;
    if (availableOnly === 'true') query.isAvailable = true;

    const ingredients = await Ingredient.find(query).sort({ category: 1, name: 1 });
    res.json(ingredients);
  } catch (err) {
    next(err);
  }
});

// POST /api/ingredients (Admin)
router.post(
  '/',
  protect,
  authorize('admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, category, price, calories, proteinGrams, isVeg, isVegan, isAvailable } =
        req.body;

      if (!name || !category || price === undefined || calories === undefined) {
        res.status(400).json({
          message: 'Name, category, price, and calories are required.',
        });
        return;
      }

      const ingredient = await Ingredient.create({
        name: String(name).trim(),
        category,
        price: Number(price),
        calories: Number(calories),
        proteinGrams: Number(proteinGrams ?? 0),
        isVeg: isVeg !== false,
        isVegan: isVegan !== false,
        isAvailable: isAvailable !== false,
      });

      res.status(201).json(ingredient);
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/ingredients/:id (Admin)
router.put(
  '/:id',
  protect,
  authorize('admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updated = await Ingredient.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });
      if (!updated) {
        res.status(404).json({ message: 'Ingredient not found.' });
        return;
      }
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/ingredients/:id (Admin)
router.delete(
  '/:id',
  protect,
  authorize('admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const deleted = await Ingredient.findByIdAndDelete(req.params.id);
      if (!deleted) {
        res.status(404).json({ message: 'Ingredient not found.' });
        return;
      }
      res.json({ message: 'Ingredient deleted.' });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
