/**
 * Google Apps Script: Create Form endpoint for mm-ranker Draft Management.
 *
 * Deploy:
 *   1. Go to https://script.google.com → New Project, paste this file.
 *   2. Deploy → New deployment → Type: Web app.
 *   3. Execute as: Me. Who has access: Anyone.
 *   4. Copy the web app URL into GitHub repo secret VITE_FORM_APPS_SCRIPT_URL.
 *
 * Security note: anyone with the URL can create forms in the deploying account.
 * The mm-ranker draft-management gate hides the URL from non-mods, but if you
 * want hard auth, add a shared-secret header check at the top of doPost.
 *
 * Request body (JSON as text/plain to avoid CORS preflight):
 *   {
 *     "title": "Draft 78 First Round Voting",
 *     "description": "Vote 0-1 for the left team ...",
 *     "matchups": [
 *       { "title": "Spurs vs Jazz", "imageBase64": "...", "filename": "matchup-spurs-vs-jazz.png" }
 *     ]
 *   }
 *
 * Response: { "editUrl": "...", "publishedUrl": "..." }
 */
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    if (!data.title || !Array.isArray(data.matchups) || data.matchups.length === 0) {
      return jsonResponse({ error: "Missing title or matchups" });
    }

    var form = FormApp.create(data.title);
    if (data.description) {
      form.setDescription(data.description);
    }

    for (var i = 0; i < data.matchups.length; i++) {
      var m = data.matchups[i];
      var bytes = Utilities.base64Decode(m.imageBase64);
      var blob = Utilities.newBlob(bytes, "image/png", m.filename || ("matchup-" + (i + 1) + ".png"));

      form.addImageItem()
        .setImage(blob)
        .setTitle(m.title || ("Matchup " + (i + 1)));

      form.addScaleItem()
        .setTitle(m.title || ("Matchup " + (i + 1)))
        .setBounds(0, 3)
        .setRequired(true);
    }

    return jsonResponse({
      editUrl: form.getEditUrl(),
      publishedUrl: form.getPublishedUrl(),
    });
  } catch (err) {
    return jsonResponse({ error: String(err) });
  }
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
