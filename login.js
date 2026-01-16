(() => {
  const SUPABASE_URL = "https://qagktukzxtwbjrdgiben.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhZ2t0dWt6eHR3YmpyZGdpYmVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NDA0NTQsImV4cCI6MjA4MzQxNjQ1NH0.cbhSWHGlmhmIt-NmUVBUtAhPpNPDKk4Bz-Gy1TbPzHk";

  const dbg = document.getElementById("dbg");
  const msgEl = document.getElementById("msg");

  const loginBtn = document.getElementById("loginBtn");
  const signupBtn = document.getElementById("signupBtn");
  const forgotBtn = document.getElementById("forgotBtn"); // ✅ optional
  const resendBtn = document.getElementById("resendBtn"); // ✅ optional

  const togglePasswordBtn = document.getElementById("togglePassword"); // ✅ optional
  const eyeOpen = document.getElementById("eyeOpen"); // ✅ optional
  const eyeClosed = document.getElementById("eyeClosed"); // ✅ optional

  const emailEl = document.getElementById("email");
  const passEl = document.getElementById("password");

  const stamp = () => new Date().toLocaleTimeString();

  function setDbg(t){
    if (dbg) dbg.textContent = "dbg: " + t;
  }
  function showMsg(text, type=""){
    if(!msgEl) return alert(text);
    msgEl.className = "msg show " + type;
    msgEl.textContent = text;
  }
  function setBusy(b){
    if (loginBtn) loginBtn.disabled = b;
    if (signupBtn) signupBtn.disabled = b;
    if (forgotBtn) forgotBtn.disabled = b;
    if (resendBtn) resendBtn.disabled = b;
  }

  setDbg("login.js loaded ✅ " + stamp());
  // keep your existing message behavior
  showMsg("Auth loading…", "");

  if (!loginBtn || !signupBtn) {
    setDbg("buttons not found ❌");
    showMsg("Buttons not found in HTML. Check ids loginBtn/signupBtn.", "error");
    return;
  }

  // Click proof (even before supabase)
  loginBtn.addEventListener("click", () => setDbg("LOGIN clicked ✅ " + stamp()));
  signupBtn.addEventListener("click", () => setDbg("SIGNUP clicked ✅ " + stamp()));
  if (forgotBtn) forgotBtn.addEventListener("click", () => setDbg("FORGOT clicked ✅ " + stamp()));
  if (resendBtn) resendBtn.addEventListener("click", () => setDbg("RESEND clicked ✅ " + stamp()));

  if (!window.supabase || typeof window.supabase.createClient !== "function") {
    setDbg("supabase missing ❌");
    showMsg("❌ Supabase not loaded. Make sure /supabase.min.js exists.", "error");
    return;
  }

  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  setDbg("supabase ready ✅ " + stamp());
  showMsg("Auth ready ✅", "");

  // ✅ Optional: read msg= from query (nice UX; no layout changes)
  try{
    const params = new URLSearchParams(location.search);
    const m = params.get("msg");
    if (m === "verify_email") showMsg("Please verify your email, then login again.", "error");
    if (m === "profile_missing") showMsg("Account profile not found. Contact support.", "error");
  } catch {}

  // ✅ Password visibility toggle (if the eye button exists in HTML)
  if (togglePasswordBtn && passEl) {
    togglePasswordBtn.addEventListener("click", () => {
      const showing = passEl.type === "text";
      passEl.type = showing ? "password" : "text";

      if (eyeOpen && eyeClosed) {
        eyeOpen.style.display = showing ? "block" : "none";
        eyeClosed.style.display = showing ? "none" : "block";
      }

      togglePasswordBtn.setAttribute("aria-pressed", String(!showing));
      togglePasswordBtn.setAttribute("aria-label", showing ? "Show password" : "Hide password");
      setDbg("TOGGLE PASS ✅ " + stamp());
    });
  }

  async function doLogin(){
    const email = (emailEl?.value || "").trim();
    const password = passEl?.value || "";
    if (!email || !password) return showMsg("Please enter email and password.", "error");

    setBusy(true);
    showMsg("Signing in…", "");
    try{
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return showMsg("Login failed: " + error.message, "error");

      showMsg("Login successful ✅ Redirecting…", "ok");
      setTimeout(()=>location.href="portal.html", 700);
    } finally {
      setBusy(false);
    }
  }

  async function doSignup(){
    const email = (emailEl?.value || "").trim();
    const password = passEl?.value || "";
    if (!email || !password) return showMsg("Please enter email and password.", "error");

    setBusy(true);
    showMsg("Creating account…", "");
    try{
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: location.origin + "/login.html" }
      });

      if (error) return showMsg("Signup failed: " + error.message, "error");
      showMsg("Account created ✅ Check your email to confirm.", "ok");
    } finally {
      setBusy(false);
    }
  }

  // ✅ Forgot password: sends reset link that lands on reset.html
  async function doForgotPassword(){
    const email = (emailEl?.value || "").trim();
    if (!email) return showMsg("Enter your email first.", "error");

    setBusy(true);
    showMsg("Sending password reset email…", "");
    try{
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: location.origin + "/reset.html"
      });

      if (error) return showMsg("Reset failed: " + error.message, "error");
      showMsg("Password reset email sent ✅ Check inbox/spam.", "ok");
    } finally {
      setBusy(false);
    }
  }

  // ✅ Resend verification email (if button exists)
  async function doResendVerification(){
    const email = (emailEl?.value || "").trim();
    if (!email) return showMsg("Enter your email first.", "error");

    setBusy(true);
    showMsg("Resending verification email…", "");
    try{
      const { error } = await supabase.auth.resend({ type: "signup", email });
      if (error) return showMsg("Resend failed: " + error.message, "error");
      showMsg("Verification email resent ✅ Check inbox/spam.", "ok");
    } finally {
      setBusy(false);
    }
  }

  // Real actions
  loginBtn.addEventListener("click", (e) => { e.preventDefault(); doLogin(); });
  signupBtn.addEventListener("click", (e) => { e.preventDefault(); doSignup(); });
  if (forgotBtn) forgotBtn.addEventListener("click", (e) => { e.preventDefault(); doForgotPassword(); });
  if (resendBtn) resendBtn.addEventListener("click", (e) => { e.preventDefault(); doResendVerification(); });
})();
