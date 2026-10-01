import axios from "axios"


const api = axios.create({
    withCredentials: true
})

function rethrowApiError(err) {
    throw new Error(err.response?.data?.message || err.message || "The request failed. Please try again.")
}

export async function register({ username, email, password }) {

    try {
        const response = await api.post('/api/auth/register', {
            username, email, password
        })

        return response.data

    } catch (err) { rethrowApiError(err) }

}

export async function login({ email, password }) {

    try {

        const response = await api.post("/api/auth/login", {
            email, password
        })

        return response.data

    } catch (err) { rethrowApiError(err) }

}

export async function logout() {
    try {

        const response = await api.get("/api/auth/logout")

        return response.data

    } catch (err) { rethrowApiError(err) }
}

export async function getMe() {

    try {

        const response = await api.get("/api/auth/get-me")

        return response.data

    } catch (err) { rethrowApiError(err) }

}
