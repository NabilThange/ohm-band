/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,

    // Disable source maps in production for faster builds
    productionBrowserSourceMaps: false,

    // Hide the dev indicator bubble
    devIndicators: {
        buildActivity: false,
        buildActivityPosition: 'bottom-right'
    },

    webpack: (config, { dev }) => {
        if (dev) {
            config.watchOptions = {
                poll: 1000, // Check for changes every second
                aggregateTimeout: 300, // Delay before rebuilding
            }
        }
        return config
    }
}

export default nextConfig
