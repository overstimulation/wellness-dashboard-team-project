import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const city = url.searchParams.get("city");

        if (!city) {
            return NextResponse.json(
                { error: "city query param required" },
                { status: 400 }
            );
        }

        const apiKey = process.env.OPENWEATHER_API_KEY;
        if (!apiKey) {
            console.error("OPENWEATHER_API_KEY not configured");
            return NextResponse.json(
                { error: "Weather service not configured" },
                { status: 500 }
            );
        }

        const weatherRes = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`
        );

        if (!weatherRes.ok) {
            const errorData = await weatherRes.json().catch(() => ({}));
            console.error("Weather API error:", errorData);
            return NextResponse.json(
                { error: "Failed to fetch weather data", details: errorData?.message },
                { status: weatherRes.status }
            );
        }

        const data = await weatherRes.json();

        return NextResponse.json({
            temp: data?.main?.temp,
            humidity: data?.main?.humidity,
            description: data?.weather?.[0]?.description,
            icon: data?.weather?.[0]?.icon,
            city: data?.name,
        });
    } catch (error) {
        console.error("WEATHER_GET_ERROR", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
