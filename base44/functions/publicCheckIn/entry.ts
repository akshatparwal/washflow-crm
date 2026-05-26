import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Public endpoint — allows unauthenticated customers to check in.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { location_id, customer_name, customer_phone, customer_email,
            vehicle_make, vehicle_model, vehicle_color, vehicle_license_plate,
            service_id, service_name, service_price, service_duration,
            payment_method, notes, loyalty_points_per_dollar } = body;

    if (!location_id || !customer_name || !customer_phone || !service_name) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Find or create customer
    const existing = await base44.asServiceRole.entities.Customer.filter({ phone: customer_phone, location_id });
    let customer;
    if (existing.length > 0) {
      customer = existing[0];
      await base44.asServiceRole.entities.Customer.update(customer.id, { is_new: false, last_visit: new Date().toISOString() });
    } else {
      customer = await base44.asServiceRole.entities.Customer.create({
        full_name: customer_name, phone: customer_phone, email: customer_email,
        location_id, is_new: true, last_visit: new Date().toISOString()
      });
    }

    // Queue position
    const today = new Date().toISOString().split('T')[0];
    const activeCheckins = await base44.asServiceRole.entities.CheckIn.filter({ location_id, check_in_date: today });
    const active = activeCheckins.filter(c => !['done', 'cancelled'].includes(c.status));
    const queuePosition = active.length + 1;

    const pts = Math.round((service_price || 0) * (loyalty_points_per_dollar || 1));

    // Create check-in
    await base44.asServiceRole.entities.CheckIn.create({
      location_id,
      customer_id: customer.id,
      customer_name,
      customer_phone,
      customer_email,
      vehicle_make, vehicle_model, vehicle_color, vehicle_license_plate,
      service_id, service_name, service_price, service_duration,
      status: 'checked_in',
      queue_position: queuePosition,
      payment_method,
      payment_status: payment_method === 'online' ? 'paid' : 'pending',
      loyalty_points_earned: pts,
      notes,
      check_in_date: today
    });

    // Update customer loyalty
    const newPoints = (customer.loyalty_points || 0) + pts;
    await base44.asServiceRole.entities.Customer.update(customer.id, {
      total_visits: (customer.total_visits || 0) + 1,
      total_spent: (customer.total_spent || 0) + (service_price || 0),
      loyalty_points: newPoints
    });

    if (pts > 0) {
      await base44.asServiceRole.entities.LoyaltyTransaction.create({
        location_id,
        customer_id: customer.id,
        type: 'earned',
        points: pts,
        description: `${service_name} — check-in`,
        balance_after: newPoints
      });
    }

    return Response.json({ success: true, queue_position: queuePosition, points_earned: pts });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});