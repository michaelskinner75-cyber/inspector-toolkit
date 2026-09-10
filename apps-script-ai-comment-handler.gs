/*
  Inspector Hub AI comment helper.

  This file is reference code for the Google Apps Script web app used by Inspector Hub.
  Keep the OpenAI API key in Apps Script > Project Settings > Script Properties as:
      OPENAI_API_KEY = your key

  In the EXISTING doPost(e), after parsing the JSON request body, route this action before
  the normal sheet-save logic:

      if (body.action === 'aiComment') {
        return jsonOutput_(handleAiComment_(body));
      }

  If the existing project already has a JSON response helper, use that. Otherwise add:

      function jsonOutput_(value) {
        return ContentService.createTextOutput(JSON.stringify(value))
          .setMimeType(ContentService.MimeType.JSON);
      }
*/

function handleAiComment_(body) {
  var text = String((body && body.text) || '').trim();
  var mode = String((body && body.mode) || 'rewrite').toLowerCase();
  var context = String((body && body.context) || 'inspection').toLowerCase();

  if (!text) return {ok:false, error:'No comment text was supplied.'};
  if (text.length > 5000) return {ok:false, error:'The comment is too long to process.'};

  var apiKey = PropertiesService.getScriptProperties().getProperty('OPENAI_API_KEY');
  if (!apiKey) return {ok:false, error:'AI_NOT_CONFIGURED'};

  var subject = context === 'vehicle' ? 'vehicle inspection comment' : 'driver inspection comment';
  var instructions;

  if (mode === 'spellcheck') {
    instructions = [
      'You are proofreading a UK bus inspector note.',
      'Correct spelling, punctuation and grammar only.',
      'Keep the original meaning, facts and level of detail.',
      'Preserve names, employee numbers, fleet numbers, service numbers, times, places and quoted words exactly unless they contain an obvious spelling error.',
      'Do not add facts, allegations, conclusions or disciplinary language.',
      'Use UK English.',
      'Return only the corrected note with no explanation.'
    ].join(' ');
  } else {
    instructions = [
      'Rewrite this '+subject+' in clear, concise, professional UK English suitable for an internal inspection record.',
      'Preserve every factual detail and do not invent or infer anything.',
      'Keep names, employee numbers, fleet numbers, service numbers, times, places and quoted words accurate.',
      'Do not make the wording more accusatory or disciplinary than the original.',
      'If the original is brief, keep the rewrite brief.',
      'Return only the rewritten note with no heading or explanation.'
    ].join(' ');
  }

  var payload = {
    model: 'gpt-5.6-luna',
    instructions: instructions,
    input: text,
    max_output_tokens: 500
  };

  var response;
  try {
    response = UrlFetchApp.fetch('https://api.openai.com/v1/responses', {
      method: 'post',
      contentType: 'application/json',
      headers: {Authorization: 'Bearer ' + apiKey},
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
  } catch (err) {
    return {ok:false, error:'The AI service could not be reached.'};
  }

  var status = response.getResponseCode();
  var data;
  try {
    data = JSON.parse(response.getContentText() || '{}');
  } catch (err) {
    return {ok:false, error:'The AI service returned an unreadable response.'};
  }

  if (status < 200 || status >= 300) {
    var apiMessage = data && data.error && data.error.message ? data.error.message : 'OpenAI request failed.';
    return {ok:false, error:apiMessage};
  }

  var result = extractAiText_(data);
  if (!result) return {ok:false, error:'The AI service returned no revised text.'};
  return {ok:true, text:result};
}

function extractAiText_(data) {
  if (data && typeof data.output_text === 'string' && data.output_text.trim()) {
    return data.output_text.trim();
  }
  var parts = [];
  var output = (data && data.output) || [];
  for (var i = 0; i < output.length; i++) {
    var content = output[i] && output[i].content || [];
    for (var j = 0; j < content.length; j++) {
      if (content[j] && content[j].type === 'output_text' && content[j].text) {
        parts.push(content[j].text);
      }
    }
  }
  return parts.join('\n').trim();
}
