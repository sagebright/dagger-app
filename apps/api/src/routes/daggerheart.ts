/**
 * Daggerheart content routes for Sage Codex API
 *
 * Provides REST endpoints for querying Daggerheart content tables.
 * All routes are prefixed with /api/daggerheart.
 */

import { Router } from 'express';
import type { Request, Response, Router as RouterType } from 'express';
import {
  getFrames,
  getAdversaries,
  getItems,
  getConsumables,
  getWeapons,
  getArmor,
  getEnvironments,
  getAncestries,
  getClasses,
  getSubclasses,
  getDomains,
  getAbilities,
  getCommunities,
  getLocations,
  getNPCs,
} from '../services/daggerheart-queries.js';
import type { QueryResult } from '../services/daggerheart-queries.js';

const router: RouterType = Router();

/**
 * Send a query result as a JSON response, handling errors consistently
 */
function sendQueryResponse<T>(res: Response, result: QueryResult<T>): void {
  if (result.error) {
    res.status(500).json({ error: result.error });
    return;
  }
  res.json({ data: result.data });
}

/**
 * Parse an optional numeric query parameter
 */
function parseNumericParam(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/** GET /api/daggerheart/frames */
router.get('/frames', async (_req: Request, res: Response) => {
  const result = await getFrames();
  sendQueryResponse(res, result);
});

/** GET /api/daggerheart/adversaries?tier=&type=&limit= */
router.get('/adversaries', async (req: Request, res: Response) => {
  const tier = parseNumericParam(req.query.tier);
  const type = req.query.type as string | undefined;
  const limit = parseNumericParam(req.query.limit);

  const result = await getAdversaries({ tier, type, limit });
  sendQueryResponse(res, result);
});

/** GET /api/daggerheart/items */
router.get('/items', async (_req: Request, res: Response) => {
  const result = await getItems();
  sendQueryResponse(res, result);
});

/** GET /api/daggerheart/consumables */
router.get('/consumables', async (_req: Request, res: Response) => {
  const result = await getConsumables();
  sendQueryResponse(res, result);
});

/** GET /api/daggerheart/weapons?tier=&category= */
router.get('/weapons', async (req: Request, res: Response) => {
  const tier = parseNumericParam(req.query.tier);
  const category = req.query.category as string | undefined;

  const result = await getWeapons({ tier, category });
  sendQueryResponse(res, result);
});

/** GET /api/daggerheart/armor?tier= */
router.get('/armor', async (req: Request, res: Response) => {
  const tier = parseNumericParam(req.query.tier);

  const result = await getArmor({ tier });
  sendQueryResponse(res, result);
});

/** GET /api/daggerheart/environments?tier= */
router.get('/environments', async (req: Request, res: Response) => {
  const tier = parseNumericParam(req.query.tier);

  const result = await getEnvironments({ tier });
  sendQueryResponse(res, result);
});

/** GET /api/daggerheart/ancestries */
router.get('/ancestries', async (_req: Request, res: Response) => {
  const result = await getAncestries();
  sendQueryResponse(res, result);
});

/** GET /api/daggerheart/classes */
router.get('/classes', async (_req: Request, res: Response) => {
  const result = await getClasses();
  sendQueryResponse(res, result);
});

/** GET /api/daggerheart/subclasses?parentClass= */
router.get('/subclasses', async (req: Request, res: Response) => {
  const parentClass = req.query.parentClass as string | undefined;

  const result = await getSubclasses({ parentClass });
  sendQueryResponse(res, result);
});

/** GET /api/daggerheart/domains */
router.get('/domains', async (_req: Request, res: Response) => {
  const result = await getDomains();
  sendQueryResponse(res, result);
});

/** GET /api/daggerheart/abilities?parentClass=&domain=&abilityType= */
router.get('/abilities', async (req: Request, res: Response) => {
  const parentClass = req.query.parentClass as string | undefined;
  const parentSubclass = req.query.parentSubclass as string | undefined;
  const domain = req.query.domain as string | undefined;
  const abilityType = req.query.abilityType as string | undefined;

  const result = await getAbilities({ parentClass, parentSubclass, domain, abilityType });
  sendQueryResponse(res, result);
});

/** GET /api/daggerheart/communities */
router.get('/communities', async (_req: Request, res: Response) => {
  const result = await getCommunities();
  sendQueryResponse(res, result);
});

/** GET /api/daggerheart/locations?tier= */
router.get('/locations', async (req: Request, res: Response) => {
  const tier = parseNumericParam(req.query.tier);

  const result = await getLocations({ tier });
  sendQueryResponse(res, result);
});

/** GET /api/daggerheart/npcs?tier=&role= */
router.get('/npcs', async (req: Request, res: Response) => {
  const tier = parseNumericParam(req.query.tier);
  const role = req.query.role as string | undefined;

  const result = await getNPCs({ tier, role });
  sendQueryResponse(res, result);
});

export default router;
