"""Test configuration and shared fixtures."""
import pytest
from fastapi.testclient import TestClient
from app import create_app


@pytest.fixture
def app():
    """Create a fresh app for each test."""
    return create_app()


@pytest.fixture
def client(app):
    """Test client for integration tests."""
    return TestClient(app)
