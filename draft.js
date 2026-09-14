export const draftFields = ['venue','event-date','end-at','crowd','seat-zone','walking','luggage','station','departure-day','departure-at','destination'];
const key='yoinmichi-session-draft-v1';
export function saveDraft(storage, values, now=Date.now()) {
  try {
    const fields={};
    for(const id of draftFields) if(typeof values[id]==='string') fields[id]=values[id].slice(0,160);
    storage.setItem(key,JSON.stringify({at:now,fields})); return true;
  } catch { return false; }
}
export function readDraft(storage, now=Date.now()) {
  try {
    const value=JSON.parse(storage.getItem(key));
    if(!value || !Number.isFinite(value.at) || now-value.at>86400000 || now<value.at) return null;
    const fields={};
    for(const id of draftFields) if(typeof value.fields?.[id]==='string') fields[id]=value.fields[id].slice(0,160);
    return fields;
  } catch { return null; }
}
