/**
 * model/user.js
 *
 * Replaces the Mongoose User model.
 * All database access goes through the pg pool exposed in connectionToDatabase.js.
 * Methods mirror the Mongoose API your controllers already rely on:
 *   User.findById, User.findOne, User.create, User.update, etc.
 */

import { query } from '../database/connectionToDatabase.js';

// ─── Column selector shortcuts ────────────────────────────────────────────────
// "safe" = everything except password + sensitive tokens
const SAFE_COLS = `
  id, name, email,
  is_verified,
  age, height_cm, weight_kg, gender, goal,
  activity_level, target_weight_kg, is_onboarded,
  target_calories, target_protein_g, target_carbs_g, target_fat_g,
  created_at, updated_at
`;

const ALL_COLS = `
  ${SAFE_COLS},
  password,
  verification_token, verification_token_expires,
  reset_password_token, reset_password_expires
`;

// ─── Helper: map a DB row → the "user object" your controllers expect ────────
// Keeps the same shape as the old Mongoose doc so controllers barely change.
const toUser = (row) => {
    if (!row) return null;
    return {
        // core
        id:            row.id,
        _id:           row.id,    // backward-compat alias used in some controllers
        name:          row.name,
        email:         row.email,
        password:      row.password,
        isVerified:    row.is_verified,

        // onboarding / profile — exposed as a nested object (same as Mongoose shape)
        profile: {
            age:           row.age,
            height:        row.height_cm,
            weight:        row.weight_kg,
            gender:        row.gender,
            goal:          row.goal,
            activityLevel: row.activity_level,
            targetWeight:  row.target_weight_kg,
            isOnboarded:   row.is_onboarded,
        },

        // daily targets
        dailyTargets: {
            calories: row.target_calories,
            protein:  row.target_protein_g,
            carbs:    row.target_carbs_g,
            fat:      row.target_fat_g,
        },

        // auth tokens
        verificationToken:          row.verification_token,
        verificationTokenExpiresAt: row.verification_token_expires,
        resetPasswordToken:         row.reset_password_token,
        resetPasswordExpiresAt:     row.reset_password_expires,

        // timestamps
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
};

// ─── User model ───────────────────────────────────────────────────────────────
export const User = {

    // ── findById(id) ─────────────────────────────────────────────────────────
    async findById(id) {
        const { rows } = await query(
            `SELECT ${ALL_COLS} FROM users WHERE id = $1 LIMIT 1`,
            [id]
        );
        return toUser(rows[0]);
    },

    // ── findOne({ email }) or ({ verificationToken: ... }) etc. ──────────────
    async findOne(conditions) {
        const keys   = Object.keys(conditions);
        const values = Object.values(conditions);

        // Map JS camelCase keys → snake_case column names
        const colMap = {
            email:                  'email',
            verificationToken:      'verification_token',
            verificationTokenExpiresAt: 'verification_token_expires',
            resetPasswordToken:     'reset_password_token',
            resetPasswordExpiresAt: 'reset_password_expires',
        };

        // Build  WHERE col = $1 AND col2 > $2 …
        const clauses = keys.map((k, i) => {
            const col = colMap[k] || k;
            // Support $gt operator: { resetPasswordExpiresAt: { $gt: Date.now() } }
            if (values[i] && typeof values[i] === 'object' && values[i].$gt !== undefined) {
                values[i] = new Date(values[i].$gt);
                return `${col} > $${i + 1}`;
            }
            return `${col} = $${i + 1}`;
        });

        const { rows } = await query(
            `SELECT ${ALL_COLS} FROM users WHERE ${clauses.join(' AND ')} LIMIT 1`,
            values
        );
        return toUser(rows[0]);
    },

    // ── create(fields) ───────────────────────────────────────────────────────
    async create({ name, email, password, verificationToken, verificationTokenExpiresAt }) {
        const { rows } = await query(
            `INSERT INTO users
               (name, email, password, verification_token, verification_token_expires)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING ${ALL_COLS}`,
            [name, email, password, verificationToken, verificationTokenExpiresAt]
        );
        return toUser(rows[0]);
    },

    // ── findByIdAndUpdate(id, updates, { new: true }) ────────────────────────
    // Supports the fields used by profile-controller.js
    async findByIdAndUpdate(id, updates, _opts) {
        const {
            profile,
            dailyTargets,
            isVerified,
            verificationToken,
            verificationTokenExpiresAt,
            resetPasswordToken,
            resetPasswordExpiresAt,
            password,
        } = updates;

        const setClauses = [];
        const values     = [];
        let   idx        = 1;

        const add = (col, val) => {
            setClauses.push(`${col} = $${idx++}`);
            values.push(val);
        };

        if (profile) {
            if (profile.age           !== undefined) add('age',              profile.age);
            if (profile.height        !== undefined) add('height_cm',        profile.height);
            if (profile.weight        !== undefined) add('weight_kg',        profile.weight);
            if (profile.gender        !== undefined) add('gender',           profile.gender);
            if (profile.goal          !== undefined) add('goal',             profile.goal);
            if (profile.activityLevel !== undefined) add('activity_level',   profile.activityLevel);
            if (profile.targetWeight  !== undefined) add('target_weight_kg', profile.targetWeight);
            if (profile.isOnboarded   !== undefined) add('is_onboarded',     profile.isOnboarded);
        }

        if (dailyTargets) {
            if (dailyTargets.calories !== undefined) add('target_calories',  dailyTargets.calories);
            if (dailyTargets.protein  !== undefined) add('target_protein_g', dailyTargets.protein);
            if (dailyTargets.carbs    !== undefined) add('target_carbs_g',   dailyTargets.carbs);
            if (dailyTargets.fat      !== undefined) add('target_fat_g',     dailyTargets.fat);
        }

        if (isVerified           !== undefined) add('is_verified',               isVerified);
        if (verificationToken    !== undefined) add('verification_token',         verificationToken);
        if (verificationTokenExpiresAt !== undefined) add('verification_token_expires', verificationTokenExpiresAt);
        if (resetPasswordToken   !== undefined) add('reset_password_token',       resetPasswordToken);
        if (resetPasswordExpiresAt     !== undefined) add('reset_password_expires', resetPasswordExpiresAt);
        if (password             !== undefined) add('password',                   password);

        if (setClauses.length === 0) return this.findById(id);

        values.push(id);   // last placeholder for WHERE
        const { rows } = await query(
            `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING ${ALL_COLS}`,
            values
        );
        return toUser(rows[0]);
    },

    // ── save(userObject) – used when controllers call user.save() ────────────
    // Accepts the user object returned by findById / findOne,
    // reads changed fields back, and upserts.
    async save(userObj) {
        return this.findByIdAndUpdate(userObj.id || userObj._id, {
            profile: userObj.profile,
            dailyTargets: userObj.dailyTargets,
            isVerified:   userObj.isVerified,
            verificationToken:          userObj.verificationToken   ?? null,
            verificationTokenExpiresAt: userObj.verificationTokenExpiresAt ?? null,
            resetPasswordToken:         userObj.resetPasswordToken  ?? null,
            resetPasswordExpiresAt:     userObj.resetPasswordExpiresAt ?? null,
            password: userObj.password,
        }, { new: true });
    },
};
