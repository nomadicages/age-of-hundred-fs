package com.plizm.ageofhundred.shared

interface Platform {
    val name: String
}

expect fun getPlatform(): Platform
