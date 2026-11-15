import { NextFunction, Router, Response } from 'express';
import { CustomSalad } from '../models/CustomSalad.ts';
import { Ingredient } from '../models/Ingredient.ts';
import { AuthRequest, protect } from '../middleware/auth.ts';

const router = Router();

router.use(protect);

// GET /api/custom-salads (My saved favorite custom salads)
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const favorites = await CustomSalad.find({ user: req.user!._id })
      .populate('base proteins toppings dressing')
      .sort({ createdAt: -1 });
    res.json(favorites);
  } catch (err) {
    next(err);
  }
});

// POST /api/custom-salads (Save a favorite custom salad)
router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      name,
      baseId,
      proteinIds = [],
      toppingIds = [],
      dressingId,
      specialInstructions = '',
    } = req.body;

    if (!name || !baseId || !dressingId) {
      res.status(400).json({
        message: 'Salad name, base, and dressing are required to save a custom bowl.',
      });
      return;
    }

    const allIds = [baseId, dressingId, ...proteinIds, ...toppingIds];
    const ingredients = await Ingredient.find({ _id: { $in: allIds } });

    const base = ingredients.find((i) => String(i._id) === String(baseId));
    const dressing = ingredients.find((i) => String(i._id) === String(dressingId));
    if (!base || !dressing) {
      res.status(400).json({ message: 'Invalid base or dressing selected.' });
      return;
    }

    const proteins = ingredients.filter((i) =>
      proteinIds.map(String).includes(String(i._id))
    );
    const toppings = ingredients.filter((i) =>
      toppingIds.map(String).includes(String(i._id))
    );

    const selectedAll = [base, dressing, ...proteins, ...toppings];
    const totalPrice = selectedAll.reduce((sum, item) => sum + item.price, 0);
    const totalCalories = selectedAll.reduce((sum, item) => sum + item.calories, 0);

    const customSalad = await CustomSalad.create({
      user: req.user!._id,
      name: String(name).trim(),
      base: base._id,
      proteins: proteins.map((p) => p._id),
      toppings: toppings.map((t) => t._id),
      dressing: dressing._id,
      specialInstructions: String(specialInstructions).trim(),
      totalPrice,
      totalCalories,
      isFavorite: true,
    });

    const populated = await CustomSalad.findById(customSalad._id).populate(
      'base proteins toppings dressing'
    );
    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/custom-salads/:id
router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const deleted = await CustomSalad.findOneAndDelete({
      _id: req.params.id,
      user: req.user!._id,
    });
    if (!deleted) {
      res.status(404).json({ message: 'Saved custom salad not found.' });
      return;
    }
    res.json({ message: 'Custom salad removed from favorites.' });
  } catch (err) {
    next(err);
  }
});

export default router;
