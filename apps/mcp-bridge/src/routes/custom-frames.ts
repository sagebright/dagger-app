/**
 * Custom Frames CRUD Route Handlers
 *
 * REST API endpoints for managing custom adventure frames.
 * Supports create, read, update, and delete operations.
 */

import { Router } from 'express';
import type { Request, Response, Router as RouterType } from 'express';
import type {
  CustomFrameResponse,
  ListCustomFramesResponse,
  CreateCustomFrameRequest,
} from '@dagger-app/shared-types';
import { getSupabase } from '../services/supabase.js';

const router: RouterType = Router();

/** Database table name for custom frames */
const TABLE_NAME = 'daggerheart_custom_frames';

/** Supabase error code for no rows found */
const NOT_FOUND_ERROR_CODE = 'PGRST116';

/** Allowed fields for update operations */
const UPDATABLE_FIELDS = [
  'title',
  'concept',
  'pitch',
  'tone_feel',
  'themes',
  'complexity_rating',
  'touchstones',
  'overview',
  'heritage_classes',
  'player_principles',
  'gm_principles',
  'distinctions',
  'inciting_incident',
  'custom_mechanics',
  'session_zero_questions',
] as const;

/**
 * Validates required fields for frame creation
 */
function validateCreatePayload(
  body: Partial<CreateCustomFrameRequest>
): string[] {
  const errors: string[] = [];

  if (!body.title?.trim()) {
    errors.push('title is required');
  }
  if (!body.concept?.trim()) {
    errors.push('concept is required');
  }
  if (!body.pitch?.trim()) {
    errors.push('pitch is required');
  }
  if (!body.tone_feel || !Array.isArray(body.tone_feel)) {
    errors.push('tone_feel is required and must be an array');
  }
  if (!body.themes || !Array.isArray(body.themes)) {
    errors.push('themes is required and must be an array');
  }

  return errors;
}

/**
 * Filters request body to only include allowed update fields
 */
function filterUpdateFields(
  body: Record<string, unknown>
): Record<string, unknown> {
  const filtered: Record<string, unknown> = {};

  for (const field of UPDATABLE_FIELDS) {
    if (body[field] !== undefined) {
      filtered[field] = body[field];
    }
  }

  return filtered;
}

/**
 * GET /api/custom-frames
 *
 * Returns a list of all custom frames, ordered by creation date (newest first).
 */
router.get('/', async (_req: Request, res: Response) => {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    const response: ListCustomFramesResponse = {
      success: false,
      error: error.message,
    };
    return res.status(500).json(response);
  }

  const response: ListCustomFramesResponse = {
    success: true,
    data: data ?? [],
    total: data?.length ?? 0,
  };

  return res.status(200).json(response);
});

/**
 * GET /api/custom-frames/:id
 *
 * Returns a single custom frame by ID.
 */
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === NOT_FOUND_ERROR_CODE) {
      const response: CustomFrameResponse = {
        success: false,
        error: 'Custom frame not found',
      };
      return res.status(404).json(response);
    }

    const response: CustomFrameResponse = {
      success: false,
      error: error.message,
    };
    return res.status(500).json(response);
  }

  const response: CustomFrameResponse = {
    success: true,
    data,
  };

  return res.status(200).json(response);
});

/**
 * POST /api/custom-frames
 *
 * Creates a new custom frame.
 * Required fields: title, concept, pitch, tone_feel, themes
 */
router.post('/', async (req: Request, res: Response) => {
  const validationErrors = validateCreatePayload(req.body);

  if (validationErrors.length > 0) {
    const response: CustomFrameResponse = {
      success: false,
      error: `Validation failed: ${validationErrors.join(', ')}`,
    };
    return res.status(400).json(response);
  }

  const supabase = getSupabase();
  const payload = filterUpdateFields(req.body);

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert(payload)
    .select()
    .single();

  if (error) {
    const response: CustomFrameResponse = {
      success: false,
      error: error.message,
    };
    return res.status(500).json(response);
  }

  const response: CustomFrameResponse = {
    success: true,
    data,
  };

  return res.status(201).json(response);
});

/**
 * PUT /api/custom-frames/:id
 *
 * Updates an existing custom frame.
 * Only provided fields are updated (partial update).
 */
router.put('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = filterUpdateFields(req.body);

  if (Object.keys(updates).length === 0) {
    const response: CustomFrameResponse = {
      success: false,
      error: 'No fields provided to update',
    };
    return res.status(400).json(response);
  }

  const supabase = getSupabase();

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === NOT_FOUND_ERROR_CODE) {
      const response: CustomFrameResponse = {
        success: false,
        error: 'Custom frame not found',
      };
      return res.status(404).json(response);
    }

    const response: CustomFrameResponse = {
      success: false,
      error: error.message,
    };
    return res.status(500).json(response);
  }

  const response: CustomFrameResponse = {
    success: true,
    data,
  };

  return res.status(200).json(response);
});

/**
 * DELETE /api/custom-frames/:id
 *
 * Deletes a custom frame by ID.
 */
router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const supabase = getSupabase();

  const { error } = await supabase.from(TABLE_NAME).delete().eq('id', id);

  if (error) {
    if (error.code === NOT_FOUND_ERROR_CODE) {
      const response: CustomFrameResponse = {
        success: false,
        error: 'Custom frame not found',
      };
      return res.status(404).json(response);
    }

    const response: CustomFrameResponse = {
      success: false,
      error: error.message,
    };
    return res.status(500).json(response);
  }

  const response: CustomFrameResponse = {
    success: true,
  };

  return res.status(200).json(response);
});

export default router;
