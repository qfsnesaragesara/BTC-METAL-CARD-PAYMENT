(() => {
  // Check if config is loaded
  if (!window.__QFS_CONFIG) {
    console.error("Config not loaded! Make sure config.js is loaded first.");
    const msgEl = document.getElementById("msg");
    if (msgEl) {
      msgEl.className = "msg show error";
      msgEl.textContent = "Configuration error. Please refresh.";
    }
    return;
  }

  // Use config values
  const SUPABASE_URL = window.__QFS_CONFIG.SUPABASE_URL;
  const SUPABASE_ANON_KEY = window.__QFS_CONFIG.SUPABASE_ANON_KEY;

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

  // ✅ ONE Supabase client from config
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  setDbg("supabase ready ✅ " + stamp());

  // ===== REDIRECT LOGIC =====
  async function decidePortal(user){
    if (!user) return "portal.html";
    
    // First try to get profile from profiles table
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('registering_for, selected_tier')
        .eq('email', user.email)
        .maybeSingle();
      
      if (profile) {
        const registeringFor = profile.registering_for;
        const selectedTier = profile.selected_tier;
        
        // QFS Account users
        if (registeringFor === 'QFS Account') {
          return "qfs-holding-dashboard.html";
        }
        
        // Gold Card users
        if (registeringFor === 'Trump Gold Card Program' || selectedTier === 'gold') {
          return "portal-gold.html";
        }
        
        // Silver and Black users - store tier for portal.html
        if (registeringFor?.includes('Silver') || registeringFor?.includes('Black') || 
            selectedTier === 'silver' || selectedTier === 'black') {
          try {
            localStorage.setItem("user_tier", selectedTier || 
              (registeringFor?.includes('Black') ? 'black' : 'silver'));
          } catch {}
          return "portal.html";
        }
        
        // MedBeds - no portal yet
        if (registeringFor?.includes('MedBeds')) {
          showMsg("MedBeds portal coming soon. Check your email for updates.", "ok");
          setTimeout(() => { window.location.href = "index.html"; }, 3000);
          return null;
        }
      }
    } catch (error) {
      console.error("Profile lookup error:", error);
    }
    
    // Fallback to user_metadata
    const metadata = user?.user_metadata || {};
    const v = String(metadata.registering_for || "").toLowerCase();
    if (v.includes("trump gold card program")) return "portal-gold.html";
    if (v.includes("qfs account")) return "qfs-holding-dashboard.html";
    
    // Default
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

      // Fetch user for routing
      const { data: u } = await supabase.auth.getUser();
      const next = await decidePortal(u?.user);
      
      if (next) {
        showMsg("Login successful ✅ Redirecting…", "ok");
        setTimeout(() => location.href = next, 600);
      }
    } catch (err) {
      showMsg("An unexpected error occurred.", "error");
      console.error("Login error:", err);
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
    } catch (err) {
      showMsg("An unexpected error occurred.", "error");
      console.error("Signup error:", err);
    } finally {
      setBusy(false);
    }
  }

  // Reset password
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
        redirectTo: "https://qfsnesaragesara.org/reset-password.html"
      });
      if (error) return showMsg("Reset failed: " + error.message, "error");
      showMsg("Password reset email sent ✅ Check inbox/spam.", "ok");
    } catch (err) {
      showMsg("An unexpected error occurred.", "error");
      console.error("Reset error:", err);
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
    } catch (err) {
      showMsg("An unexpected error occurred.", "error");
      console.error("Resend error:", err);
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
