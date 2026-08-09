export function onRequestGet({ env }) {
  const development = env.BUILD_MODE !== 'false';

  return Response.json({
    buildMode: development,
    feedbackEnabled: development && env.FEEDBACK_ENABLED !== 'false',
    adminRolePreviewEnabled: development && env.ADMIN_ROLE_PREVIEW_ENABLED !== 'false'
  }, {
    headers: {
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff'
    }
  });
}
