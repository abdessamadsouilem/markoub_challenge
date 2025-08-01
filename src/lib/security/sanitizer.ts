export class InputSanitizer {
    /**
     * Sanitize HTML content to prevent XSS attacks
     */
    static sanitizeHtml(html: string): string {
        return html.replace(/<[^>]*>/g, '').replace(/javascript:/gi, '').replace(/on\w+=/gi, '');
    }

    /**
     * Sanitize plain text input
     */
    static sanitizeText(text: string): string {
        if (typeof text !== 'string') {
            return '';
        }

        // Remove potentially dangerous characters and HTML tags
        return text
            .replace(/<[^>]*>/g, '') // Remove all HTML tags
            .replace(/javascript:/gi, '') // Remove javascript: protocol
            .replace(/on\w+=/gi, '') // Remove event handlers
            .trim();
    }

    /**
     * Sanitize email address
     */
    static sanitizeEmail(email: string): string {
        if (typeof email !== 'string') {
            return '';
        }

        return email.toLowerCase().trim();
    }

    /**
     * Sanitize phone number
     */
    static sanitizePhone(phone: string): string {
        if (typeof phone !== 'string') {
            return '';
        }

        // Remove all non-digit characters except + and -
        return phone.replace(/[^\d+\-]/g, '');
    }

    /**
     * Sanitize license number (alphanumeric only)
     */
    static sanitizeLicense(license: string): string {
        if (typeof license !== 'string') {
            return '';
        }

        return license.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    }

    /**
     * Validate and sanitize date string
     */
    static sanitizeDate(date: string): string | null {
        if (typeof date !== 'string') {
            return null;
        }

        const parsed = new Date(date);
        if (isNaN(parsed.getTime())) {
            return null;
        }

        return parsed.toISOString().split('T')[0]; // Return YYYY-MM-DD format
    }

    /**
     * Sanitize time string (HH:MM format)
     */
    static sanitizeTime(time: string): string | null {
        if (typeof time !== 'string') {
            return null;
        }

        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(time)) {
            return null;
        }

        return time;
    }

    /**
     * Sanitize numeric input
     */
    static sanitizeNumber(value: unknown): number | null {
        if (typeof value === 'number') {
            return value;
        }

        if (typeof value === 'string') {
            const parsed = parseFloat(value);
            return isNaN(parsed) ? null : parsed;
        }

        return null;
    }

    /**
     * Sanitize object properties recursively
     */
    static sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
        const sanitized: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'string') {
                sanitized[key] = this.sanitizeText(value);
            } else if (typeof value === 'object' && value !== null) {
                sanitized[key] = this.sanitizeObject(value as Record<string, unknown>);
            } else {
                sanitized[key] = value;
            }
        }
        return sanitized;
    }
} 