/**
 * Google Apps Script: Create Form endpoint for mm-ranker Draft Management.
 *
 * Deploy:
 *   1. Go to https://script.google.com → New Project.
 *   2. Paste this file into Code.gs.
 *   3. In Project Settings → "Show appsscript.json manifest file", then replace
 *      appsscript.json with the contents shown at the bottom of this file.
 *   4. Deploy → New deployment → Type: Web app.
 *      - Execute as: Me
 *      - Who has access: Anyone
 *   5. First deploy will prompt you to authorize Drive + external requests.
 *   6. Copy the web app /exec URL into GitHub repo secret VITE_FORM_APPS_SCRIPT_URL
 *      and into .env.local for local dev.
 *
 * How it works:
 *   - Creates the form via FormApp (title, description, required Discord username).
 *   - For each matchup: decodes the base64 PNG, writes it to Drive, makes it
 *     link-viewable, then calls the Forms REST API batchUpdate to add a linear
 *     scale question (0-3, required) with the image attached directly to the
 *     question — so image + scale render as a single item, not two.
 *   - Forms fetches the image once and stores its own copy, so the Drive files
 *     can be deleted afterwards (we do that on success).
 *
 * Security note: anyone with the /exec URL can create forms in the deploying
 * account. The mm-ranker draft-management gate hides the URL from non-mods.
 * For hard auth, add a shared-secret header check at the top of doPost.
 */

var FORMS_API_BASE = "https://forms.googleapis.com/v1/forms/";
var DISCORD_QUESTION_TITLE = "What's your discord username?";
var FORM_EDITORS = [
  "mubsyki@gmail.com",
  "jpickup6@gmail.com",
  "Bilmortensen13579@gmail.com",
  "francisco.cid.martins@gmail.com",
  "gabrielsantc30@gmail.com",
  "seanryan2201@gmail.com",
  "ragingcal@gmail.com",
];

function doPost(e) {
  try {
    var raw = (e && e.parameter && e.parameter.payload)
      || (e && e.postData && e.postData.contents);
    if (!raw) {
      return jsonResponse({ error: "Missing request body" });
    }
    var data = JSON.parse(raw);
    if (!data.title || !Array.isArray(data.matchups) || data.matchups.length === 0) {
      return jsonResponse({ error: "Missing title or matchups" });
    }

    var form = FormApp.create(data.title);
    if (data.description) {
      form.setDescription(data.description);
    }

    form.addTextItem()
      .setTitle(DISCORD_QUESTION_TITLE)
      .setRequired(true);

    var formId = form.getId();

    var creator = Session.getEffectiveUser().getEmail().toLowerCase();
    for (var e = 0; e < FORM_EDITORS.length; e++) {
      if (FORM_EDITORS[e].toLowerCase() !== creator) {
        form.addEditor(FORM_EDITORS[e]);
      }
    }

    var uploaded = [];
    for (var i = 0; i < data.matchups.length; i++) {
      var m = data.matchups[i];
      var bytes = Utilities.base64Decode(m.imageBase64);
      var blob = Utilities.newBlob(bytes, "image/png", m.filename || ("matchup-" + (i + 1) + ".png"));
      var file = DriveApp.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      uploaded.push({
        fileId: file.getId(),
        title: m.title || ("Matchup " + (i + 1)),
        homeLabel: m.homeLabel || "",
        awayLabel: m.awayLabel || "",
        sourceUri: "https://drive.google.com/uc?export=view&id=" + file.getId(),
      });
    }

    // Discord question is already at index 0, matchups go after it.
    var requests = uploaded.map(function (item, idx) {
      return {
        createItem: {
          item: {
            title: item.title,
            questionItem: {
              question: {
                required: true,
                scaleQuestion: { low: 0, high: 3, lowLabel: item.homeLabel, highLabel: item.awayLabel },
              },
              image: { sourceUri: item.sourceUri },
            },
          },
          location: { index: 1 + idx },
        },
      };
    });

    var token = ScriptApp.getOAuthToken();
    var response = UrlFetchApp.fetch(FORMS_API_BASE + formId + ":batchUpdate", {
      method: "post",
      contentType: "application/json",
      headers: { Authorization: "Bearer " + token },
      payload: JSON.stringify({ requests: requests }),
      muteHttpExceptions: true,
    });

    var code = response.getResponseCode();
    if (code < 200 || code >= 300) {
      return jsonResponse({
        error: "Forms API batchUpdate failed (" + code + "): " + response.getContentText(),
        editUrl: form.getEditUrl(),
      });
    }

    // Forms has copied the images by now; clean up the Drive originals.
    for (var j = 0; j < uploaded.length; j++) {
      try {
        DriveApp.getFileById(uploaded[j].fileId).setTrashed(true);
      } catch (cleanupErr) {
        // non-fatal
      }
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

/**
 * Diagnostic: run this manually from the editor (select testScopes in the
 * function dropdown → Run). It exercises Drive + UrlFetchApp so Apps Script
 * will prompt for every scope the real doPost needs. If it prints "Scopes OK",
 * the deployment is ready.
 */
function testScopes() {
  var blob = Utilities.newBlob("ok", "text/plain", "mm-ranker-scope-test.txt");
  var file = DriveApp.createFile(blob);
  file.setTrashed(true);
  var email = Session.getEffectiveUser().getEmail();
  Logger.log("Running as: " + email);
  var token = ScriptApp.getOAuthToken();
  if (!token) throw new Error("No OAuth token");
  Logger.log("Scopes OK");
}

/**
 * appsscript.json — copy the block below into the manifest file.
 * The forms.body + drive scopes are required for the Forms REST API call and
 * the Drive image upload; script.external_request is required for UrlFetchApp.
 *
 * {
 *   "timeZone": "America/New_York",
 *   "dependencies": {},
 *   "webapp": {
 *     "access": "ANYONE",
 *     "executeAs": "USER_DEPLOYING"
 *   },
 *   "exceptionLogging": "STACKDRIVER",
 *   "runtimeVersion": "V8",
 *   "oauthScopes": [
 *     "https://www.googleapis.com/auth/forms",
 *     "https://www.googleapis.com/auth/forms.body",
 *     "https://www.googleapis.com/auth/drive",
 *     "https://www.googleapis.com/auth/script.external_request",
 *     "https://www.googleapis.com/auth/userinfo.email"
 *   ]
 * }
 */
