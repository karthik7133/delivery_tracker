export function success(res, data, code = 200) {
  return res.status(code).json({ success: true, data });
}

export function created(res, data) {
  return res.status(201).json({ success: true, data });
}

export function fail(res, message, code = 400) {
  return res.status(code).json({ success: false, message });
}
