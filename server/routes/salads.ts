import { NextFunction, Router, Request, Response } from 'express';
import { Salad } from '../models/Salad.ts';
import { authorize, protect } from '../middleware/auth.ts';

const router = Router();

// GET /api/salads
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { dietaryType, search, availableOnly } = req.query;
    const query: Record<string, unknown> = {};

    if (dietaryType && dietaryType !== 'all') {
      query.dietaryType = dietaryType;
    }
    if (availableOnly === 'true') {
      query.isAvailable = true;
    }
    if (search && String(search).trim()) {
      const regex = new RegExp(String(search).trim(), 'i');
      query.$or = [{ name: regex }, { description: regex }, { tags: regex }];
    }

    const salads = await Salad.find(query).sort({ featured: -1, createdAt: -1 });
    res.json(salads);
  } catch (err) {
    next(err);
  }
});

// GET /api/salads/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const salad = await Salad.findById(req.params.id);
    if (!salad) {
      res.status(404).json({ message: 'Salad not found.' });
      return;
    }
    res.json(salad);
  } catch (err) {
    next(err);
  }
});

// POST /api/salads (Admin)
router.post(
  '/',
  protect,
  authorize('admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        name,
        description,
        price,
        calories,
        proteinGrams,
        carbsGrams,
        fatGrams,
        dietaryType,
        tags,
        ingredientsSummary,
        imageUrl,
        isAvailable,
        featured,
      } = req.body;

      if (!name || !description || price === undefined || calories === undefined || !dietaryType) {
        res.status(400).json({
          message: 'Name, description, price, calories, and dietary type are required.',
        });
        return;
      }

      const salad = await Salad.create({
        name: String(name).trim(),
        description: String(description).trim(),
        price: Number(price),
        calories: Number(calories),
        proteinGrams: Number(proteinGrams ?? 18),
        carbsGrams: Number(carbsGrams ?? 30),
        fatGrams: Number(fatGrams ?? 14),
        dietaryType,
        tags: Array.isArray(tags) ? tags : [],
        ingredientsSummary: Array.isArray(ingredientsSummary) ? ingredientsSummary : [],
        imageUrl:
          imageUrl?.trim() ||
          '/src/assets/images/salad_mediterranean_quinoa_1794716401769.jpg',
        isAvailable: isAvailable !== false,
        featured: Boolean(featured),
      });

      res.status(201).json(salad);
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/salads/:id (Admin)
router.put(
  '/:id',
  protect,
  authorize('admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updated = await Salad.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });
      if (!updated) {
        res.status(404).json({ message: 'Salad not found.' });
        return;
      }
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/salads/:id (Admin)
router.delete(
  '/:id',
  protect,
  authorize('admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const deleted = await Salad.findByIdAndDelete(req.params.id);
      if (!deleted) {
        res.status(404).json({ message: 'Salad not found.' });
        return;
      }
      res.json({ message: 'Salad removed from menu.' });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
