(() => {
  const SUPABASE_URL = "https://qagktukzxtwbjrdgiben.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhZ2t0dWt6eHR3YmpyZGdpYmVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NDA0NTQsImV4cCI6MjA4MzQxNjQ1NH0.cbhSWHGlmhmIt-NmUVBUtAhPpNPDKk4Bz-Gy1TbPzHk";

  const dbg = document.getElementById("dbg");
  const msgEl = document.getElementById("msg");

  const loginBtn = document.getElementById("loginBtn");
  const signupBtn = document.getElementById("signupBtn");
  const forgotBtn = document.getElementById("forgotBtn");
  const resendBtn = document.getElementById("resendBtn");

  const emailEl = document.getElementById("email");
  const passEl = document.getElementById("password");

  const stamp = () => new Date().toLocaleTimeString();

  function setDbg(t){ if (dbg) dbg.textContent = "dbg: " + t; }
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

  if (!window.supabase || typeof window.supabase.createClient !== "function") {
    setDbg("supabase missing ❌");
    showMsg("❌ Supabase not loaded.", "error");
    return;
  }

  // ✅ ONE Supabase client
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  setDbg("supabase ready ✅ " + stamp());

  function decidePortal(user){
    const v = String(user?.user_metadata?.registering_for || "").toLowerCase();
    if (v.includes("trump gold card program")) return "portal-gold.html";
    // silver + black + everything else
    return "portal.html";
  }

  async function doLogin(){
    const email = (emailEl?.value || "").trim().toLowerCase();
    const password = passEl?.value || "";
    if (!email || !password) return showMsg("Please enter email and password.", "error");

    setBusy(true);
    showMsg("Signing in…");
    try{
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return showMsg("Login failed: " + error.message, "error");

      // Fetch user metadata for routing
      const { data: u } = await supabase.auth.getUser();
      const next = decidePortal(u?.user);

      showMsg("Login successful ✅ Redirecting…", "ok");
      setTimeout(()=>location.href = next, 600);
    } finally {
      setBusy(false);
    }
  }

  async function doSignup(){
    const email = (emailEl?.value || "").trim().toLowerCase();
    const password = passEl?.value || "";
    if (!email || !password) return showMsg("Please enter email and password.", "error");
    if (String(password).length < 8) return showMsg("Password must be at least 8 characters.", "error");

    // If they registered via registration.html, we stored this choice
    let registering_for = "";
    try { registering_for = localStorage.getItem("qfs_registering_for") || ""; } catch {}

    setBusy(true);
    showMsg("Creating account…");
    try{
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: registering_for ? { registering_for } : {},
          emailRedirectTo: "https://qfsnesaragesara.org/login.html"
        }
      });

      if (error) return showMsg("Signup failed: " + error.message, "error");
      showMsg("Account created ✅ Check your email to confirm.", "ok");
    } finally {
      setBusy(false);
    }
  }

  // ✅ ONE reset trigger (guarded)
  let forgotBusy = false;
  async function doForgot(){
    if (forgotBusy) return;
    forgotBusy = true;

    const email = (emailEl?.value || "").trim().toLowerCase();
    if (!email) { forgotBusy = false; return showMsg("Enter your email first.", "error"); }

    setBusy(true);
    showMsg("Sending reset email…");
    try{
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: "https://qfsnesaragesara.org/reset.html"
      });
      if (error) return showMsg("Reset failed: " + error.message, "error");
      showMsg("Password reset email sent ✅ Check inbox/spam.", "ok");
    } finally {
      setBusy(false);
      setTimeout(()=>{ forgotBusy = false; }, 1500);
    }
  }

  async function doResend(){
    const email = (emailEl?.value || "").trim().toLowerCase();
    if (!email) return showMsg("Enter your email first.", "error");

    setBusy(true);
    showMsg("Resending verification…");
    try{
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: "https://qfsnesaragesara.org/login.html" }
      });
      if (error) return showMsg("Resend failed: " + error.message, "error");
      showMsg("Verification email resent ✅ Check inbox/spam.", "ok");
    } finally {
      setBusy(false);
    }
  }

  // Wire buttons
  if (loginBtn) loginBtn.addEventListener("click", (e) => { e.preventDefault(); doLogin(); });
  if (signupBtn) signupBtn.addEventListener("click", (e) => { e.preventDefault(); doSignup(); });
  if (forgotBtn) forgotBtn.addEventListener("click", (e) => { e.preventDefault(); doForgot(); });
  if (resendBtn) resendBtn.addEventListener("click", (e) => { e.preventDefault(); doResend(); });

})();
