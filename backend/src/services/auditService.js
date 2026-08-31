async function logAudit(db, { actorId, action, entity, entityId, metadata = {} }) {
  await db.query(
    `INSERT INTO audit_logs (actor_id, action, entity, entity_id, metadata)
     VALUES ($1, $2, $3, $4, $5)`,
    [actorId || null, action, entity, entityId || null, metadata]
  );
}

module.exports = { logAudit };
