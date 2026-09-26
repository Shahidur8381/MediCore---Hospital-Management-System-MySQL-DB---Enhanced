const OTPAuth = require('otpauth');

function verifyAdminCode(code) {
    if (!code) return false;
    
    const secretStr = process.env.TOTP_SHARED_SECRET || 'VO3W7H2JT7N2HPUNE3QU2MGTKJVHBGXK';
    
    try {
        const totp = new OTPAuth.TOTP({
            issuer: "MediCore",
            label: "Admin",
            algorithm: "SHA1",
            digits: 6,
            period: 30,
            secret: OTPAuth.Secret.fromBase32(secretStr)
        });

        const delta = totp.validate({
            token: code,
            window: 1
        });

        return delta !== null;
    } catch (e) {
        console.error("TOTP Verification Error:", e);
        return false;
    }
}

module.exports = { verifyAdminCode };
