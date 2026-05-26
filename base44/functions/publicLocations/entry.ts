import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Public endpoint — no auth required. Returns active locations (and their services if slug provided).
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { slug, location_id } = body;

    if (slug) {
      // Single location lookup by slug (for check-in page)
      const locations = await base44.asServiceRole.entities.Location.filter({ slug, is_active: true });
      if (locations.length === 0) return Response.json({ location: null, services: [] });
      const loc = locations[0];
      const services = await base44.asServiceRole.entities.Service.filter({ location_id: loc.id, is_active: true }, 'sort_order');
      return Response.json({ location: loc, services });
    }

    if (location_id) {
      // Services for a known location_id
      const services = await base44.asServiceRole.entities.Service.filter({ location_id, is_active: true }, 'sort_order');
      return Response.json({ services });
    }

    // All active locations (for Find Wash / CustomerHome)
    const locations = await base44.asServiceRole.entities.Location.filter({ is_active: true });
    return Response.json({ locations });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});