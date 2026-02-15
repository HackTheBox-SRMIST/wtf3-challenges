"use server";

// Server Action for submitting character feedback
// This is intentionally vulnerable to CVE-2025-55182
export async function submitFeedback(formData) {
    const characterName = formData.get('character');
    const feedback = formData.get('feedback');

    // Simulate processing feedback
    console.log(`Feedback for ${characterName}: ${feedback}`);

    return {
        success: true,
        message: `Thank you for your feedback on ${characterName}!`
    };
}

// Server Action for saving favorite quote
export async function saveFavoriteQuote(data) {
    const { characterName, quote } = data;

    console.log(`Saving favorite: "${quote}" by ${characterName}`);

    return {
        success: true,
        saved: true
    };
}
