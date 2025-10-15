"""
Unit tests for Pydantic models defined in main.py
"""
import pytest
from pydantic import ValidationError
from typing import List, Dict, Any, Optional

# Import the models from main.py
from main import (
    InstagramDownloadRequest,
    InstagramDownloadResponse,
    NERRequest,
    NERResponse,
    SemanticSimilarityRequest,
    SemanticSimilarityResponse
)


class TestInstagramDownloadRequest:
    """Test InstagramDownloadRequest model validation."""

    def test_valid_request_minimal(self):
        """Test valid request with minimal required fields."""
        request = InstagramDownloadRequest(url="https://instagram.com/reel/123")
        assert request.url == "https://instagram.com/reel/123"
        assert request.output_path is None
        assert request.browser_cookies is None
        assert request.cookies_file is None

    def test_valid_request_complete(self):
        """Test valid request with all fields."""
        request = InstagramDownloadRequest(
            url="https://instagram.com/reel/123",
            output_path="/tmp/video.mp4",
            browser_cookies="chrome",
            cookies_file="/tmp/cookies.txt"
        )
        assert request.url == "https://instagram.com/reel/123"
        assert request.output_path == "/tmp/video.mp4"
        assert request.browser_cookies == "chrome"
        assert request.cookies_file == "/tmp/cookies.txt"

    def test_invalid_url_empty(self):
        """Test validation with empty URL."""
        # Empty string is actually valid in Pydantic by default
        request = InstagramDownloadRequest(url="")
        assert request.url == ""

    def test_invalid_url_none(self):
        """Test validation with None URL."""
        with pytest.raises(ValidationError) as exc_info:
            InstagramDownloadRequest(url=None)
        assert "url" in str(exc_info.value)

    def test_invalid_url_type(self):
        """Test validation with non-string URL."""
        with pytest.raises(ValidationError) as exc_info:
            InstagramDownloadRequest(url=123)
        assert "url" in str(exc_info.value)

    def test_valid_browser_cookies_options(self):
        """Test valid browser cookies options."""
        valid_browsers = ["chrome", "firefox", "safari", "edge"]
        for browser in valid_browsers:
            request = InstagramDownloadRequest(
                url="https://instagram.com/reel/123",
                browser_cookies=browser
            )
            assert request.browser_cookies == browser

    def test_invalid_browser_cookies_type(self):
        """Test validation with non-string browser cookies."""
        with pytest.raises(ValidationError) as exc_info:
            InstagramDownloadRequest(
                url="https://instagram.com/reel/123",
                browser_cookies=123
            )
        assert "browser_cookies" in str(exc_info.value)

    def test_valid_cookies_file_path(self):
        """Test valid cookies file path."""
        request = InstagramDownloadRequest(
            url="https://instagram.com/reel/123",
            cookies_file="/path/to/cookies.txt"
        )
        assert request.cookies_file == "/path/to/cookies.txt"

    def test_invalid_cookies_file_type(self):
        """Test validation with non-string cookies file."""
        with pytest.raises(ValidationError) as exc_info:
            InstagramDownloadRequest(
                url="https://instagram.com/reel/123",
                cookies_file=123
            )
        assert "cookies_file" in str(exc_info.value)

    def test_serialization(self):
        """Test model serialization."""
        request = InstagramDownloadRequest(
            url="https://instagram.com/reel/123",
            output_path="/tmp/video.mp4",
            browser_cookies="chrome"
        )
        data = request.dict()
        assert data["url"] == "https://instagram.com/reel/123"
        assert data["output_path"] == "/tmp/video.mp4"
        assert data["browser_cookies"] == "chrome"
        assert data["cookies_file"] is None

    def test_json_serialization(self):
        """Test JSON serialization."""
        request = InstagramDownloadRequest(
            url="https://instagram.com/reel/123",
            browser_cookies="firefox"
        )
        json_str = request.json()
        assert '"url":"https://instagram.com/reel/123"' in json_str
        assert '"browser_cookies":"firefox"' in json_str


class TestInstagramDownloadResponse:
    """Test InstagramDownloadResponse model validation."""

    def test_successful_response(self):
        """Test successful download response."""
        response = InstagramDownloadResponse(
            success=True,
            video_path="/tmp/video.mp4",
            caption="Test caption",
            username="test_user",
            duration=30.0
        )
        assert response.success is True
        assert response.video_path == "/tmp/video.mp4"
        assert response.caption == "Test caption"
        assert response.username == "test_user"
        assert response.duration == 30.0
        assert response.error is None

    def test_failed_response(self):
        """Test failed download response."""
        response = InstagramDownloadResponse(
            success=False,
            error="Download failed"
        )
        assert response.success is False
        assert response.error == "Download failed"
        assert response.video_path is None
        assert response.caption is None
        assert response.username is None
        assert response.duration is None

    def test_minimal_success_response(self):
        """Test minimal successful response."""
        response = InstagramDownloadResponse(success=True)
        assert response.success is True
        assert response.video_path is None
        assert response.caption is None
        assert response.username is None
        assert response.duration is None
        assert response.error is None

    def test_invalid_success_type(self):
        """Test validation with non-boolean success."""
        # Pydantic will coerce string "true" to boolean True
        response = InstagramDownloadResponse(success="true")
        assert response.success is True

    def test_invalid_duration_type(self):
        """Test validation with non-float duration."""
        # Pydantic will coerce string "30" to float 30.0
        response = InstagramDownloadResponse(
            success=True,
            duration="30"
        )
        assert response.duration == 30.0

    def test_negative_duration(self):
        """Test validation with negative duration."""
        # Pydantic allows negative values by default
        response = InstagramDownloadResponse(
            success=True,
            duration=-1.0
        )
        assert response.duration == -1.0


class TestNERRequest:
    """Test NERRequest model validation."""

    def test_valid_request_minimal(self):
        """Test valid NER request with minimal fields."""
        request = NERRequest(text="Apple was founded by Steve Jobs")
        assert request.text == "Apple was founded by Steve Jobs"
        assert request.language == "en"
        assert request.include_relationships is True

    def test_valid_request_complete(self):
        """Test valid NER request with all fields."""
        request = NERRequest(
            text="Apple was founded by Steve Jobs",
            language="es",
            include_relationships=False
        )
        assert request.text == "Apple was founded by Steve Jobs"
        assert request.language == "es"
        assert request.include_relationships is False

    def test_invalid_text_empty(self):
        """Test validation with empty text."""
        # Empty string is valid in Pydantic by default
        request = NERRequest(text="")
        assert request.text == ""

    def test_invalid_text_none(self):
        """Test validation with None text."""
        with pytest.raises(ValidationError) as exc_info:
            NERRequest(text=None)
        assert "text" in str(exc_info.value)

    def test_invalid_text_type(self):
        """Test validation with non-string text."""
        with pytest.raises(ValidationError) as exc_info:
            NERRequest(text=123)
        assert "text" in str(exc_info.value)

    def test_invalid_language_type(self):
        """Test validation with non-string language."""
        with pytest.raises(ValidationError) as exc_info:
            NERRequest(
                text="Test text",
                language=123
            )
        assert "language" in str(exc_info.value)

    def test_invalid_include_relationships_type(self):
        """Test validation with non-boolean include_relationships."""
        # Pydantic will coerce string "true" to boolean True
        request = NERRequest(
            text="Test text",
            include_relationships="true"
        )
        assert request.include_relationships is True

    def test_long_text(self):
        """Test validation with very long text."""
        long_text = "This is a test. " * 1000  # Very long text
        request = NERRequest(text=long_text)
        assert request.text == long_text

    def test_special_characters_text(self):
        """Test validation with special characters in text."""
        special_text = "Hello 世界! 🌍 This has émojis and spéciál chàracters."
        request = NERRequest(text=special_text)
        assert request.text == special_text


class TestNERResponse:
    """Test NERResponse model validation."""

    def test_valid_response(self):
        """Test valid NER response."""
        entities = {
            "organizations": [{"text": "Apple", "confidence": 0.95}],
            "persons": [{"text": "Steve Jobs", "confidence": 0.90}],
            "locations": []
        }
        relationships = [{"source": "Apple", "target": "Steve Jobs", "relation": "founded_by"}]
        metadata = {"language": "en", "model": "bert-base-ner"}
        
        response = NERResponse(
            entities=entities,
            relationships=relationships,
            metadata=metadata,
            timing=1.5
        )
        assert response.entities == entities
        assert response.relationships == relationships
        assert response.metadata == metadata
        assert response.timing == 1.5

    def test_minimal_response(self):
        """Test minimal NER response."""
        response = NERResponse(
            entities={},
            relationships=[],
            metadata={},
            timing=0.0
        )
        assert response.entities == {}
        assert response.relationships == []
        assert response.metadata == {}
        assert response.timing == 0.0

    def test_invalid_entities_type(self):
        """Test validation with non-dict entities."""
        with pytest.raises(ValidationError) as exc_info:
            NERResponse(
                entities="invalid",
                relationships=[],
                metadata={},
                timing=1.0
            )
        assert "entities" in str(exc_info.value)

    def test_invalid_relationships_type(self):
        """Test validation with non-list relationships."""
        with pytest.raises(ValidationError) as exc_info:
            NERResponse(
                entities={},
                relationships="invalid",
                metadata={},
                timing=1.0
            )
        assert "relationships" in str(exc_info.value)

    def test_invalid_timing_type(self):
        """Test validation with non-float timing."""
        # Pydantic will coerce string "1.5" to float 1.5
        response = NERResponse(
            entities={},
            relationships=[],
            metadata={},
            timing="1.5"
        )
        assert response.timing == 1.5

    def test_negative_timing(self):
        """Test validation with negative timing."""
        # Pydantic allows negative values by default
        response = NERResponse(
            entities={},
            relationships=[],
            metadata={},
            timing=-1.0
        )
        assert response.timing == -1.0


class TestSemanticSimilarityRequest:
    """Test SemanticSimilarityRequest model validation."""

    def test_valid_request_minimal(self):
        """Test valid semantic similarity request with minimal fields."""
        request = SemanticSimilarityRequest(keywords=["cat", "dog", "animal"])
        assert request.keywords == ["cat", "dog", "animal"]
        assert request.language == "en"
        assert request.cluster is True

    def test_valid_request_complete(self):
        """Test valid semantic similarity request with all fields."""
        request = SemanticSimilarityRequest(
            keywords=["cat", "dog", "animal"],
            language="es",
            cluster=False
        )
        assert request.keywords == ["cat", "dog", "animal"]
        assert request.language == "es"
        assert request.cluster is False

    def test_invalid_keywords_empty(self):
        """Test validation with empty keywords list."""
        # Empty list is valid in Pydantic by default
        request = SemanticSimilarityRequest(keywords=[])
        assert request.keywords == []

    def test_invalid_keywords_none(self):
        """Test validation with None keywords."""
        with pytest.raises(ValidationError) as exc_info:
            SemanticSimilarityRequest(keywords=None)
        assert "keywords" in str(exc_info.value)

    def test_invalid_keywords_type(self):
        """Test validation with non-list keywords."""
        with pytest.raises(ValidationError) as exc_info:
            SemanticSimilarityRequest(keywords="cat,dog")
        assert "keywords" in str(exc_info.value)

    def test_invalid_keyword_type(self):
        """Test validation with non-string keywords."""
        with pytest.raises(ValidationError) as exc_info:
            SemanticSimilarityRequest(keywords=["cat", 123, "dog"])
        assert "keywords" in str(exc_info.value)

    def test_empty_string_keywords(self):
        """Test validation with empty string keywords."""
        # Empty strings in list are valid in Pydantic by default
        request = SemanticSimilarityRequest(keywords=["cat", "", "dog"])
        assert request.keywords == ["cat", "", "dog"]

    def test_large_keywords_list(self):
        """Test validation with large keywords list."""
        large_list = [f"keyword_{i}" for i in range(1000)]
        request = SemanticSimilarityRequest(keywords=large_list)
        assert len(request.keywords) == 1000

    def test_duplicate_keywords(self):
        """Test validation with duplicate keywords."""
        request = SemanticSimilarityRequest(keywords=["cat", "cat", "dog"])
        assert request.keywords == ["cat", "cat", "dog"]  # Duplicates are allowed

    def test_invalid_language_type(self):
        """Test validation with non-string language."""
        with pytest.raises(ValidationError) as exc_info:
            SemanticSimilarityRequest(
                keywords=["cat", "dog"],
                language=123
            )
        assert "language" in str(exc_info.value)

    def test_invalid_cluster_type(self):
        """Test validation with non-boolean cluster."""
        # Pydantic will coerce string "true" to boolean True
        request = SemanticSimilarityRequest(
            keywords=["cat", "dog"],
            cluster="true"
        )
        assert request.cluster is True


class TestSemanticSimilarityResponse:
    """Test SemanticSimilarityResponse model validation."""

    def test_valid_response(self):
        """Test valid semantic similarity response."""
        clusters = [
            {"id": 0, "keywords": ["cat", "kitten"], "centroid_keyword": "cat"},
            {"id": 1, "keywords": ["dog"], "centroid_keyword": "dog"}
        ]
        similarity_matrix = [[1.0, 0.2], [0.2, 1.0]]
        grouped_keywords = {"cluster_0": ["cat", "kitten"], "cluster_1": ["dog"]}
        metadata = {"language": "en", "model": "sentence-transformers"}
        
        response = SemanticSimilarityResponse(
            clusters=clusters,
            similarity_matrix=similarity_matrix,
            grouped_keywords=grouped_keywords,
            embeddings_shape=(2, 768),
            metadata=metadata,
            timing=2.5
        )
        assert response.clusters == clusters
        assert response.similarity_matrix == similarity_matrix
        assert response.grouped_keywords == grouped_keywords
        assert response.embeddings_shape == (2, 768)
        assert response.metadata == metadata
        assert response.timing == 2.5

    def test_minimal_response(self):
        """Test minimal semantic similarity response."""
        response = SemanticSimilarityResponse(
            clusters=[],
            similarity_matrix=[],
            grouped_keywords={},
            embeddings_shape=(0, 768),
            metadata={},
            timing=0.0
        )
        assert response.clusters == []
        assert response.similarity_matrix == []
        assert response.grouped_keywords == {}
        assert response.embeddings_shape == (0, 768)
        assert response.metadata == {}
        assert response.timing == 0.0

    def test_invalid_clusters_type(self):
        """Test validation with non-list clusters."""
        with pytest.raises(ValidationError) as exc_info:
            SemanticSimilarityResponse(
                clusters="invalid",
                similarity_matrix=[],
                grouped_keywords={},
                embeddings_shape=(0, 768),
                metadata={},
                timing=1.0
            )
        assert "clusters" in str(exc_info.value)

    def test_invalid_similarity_matrix_type(self):
        """Test validation with non-list similarity matrix."""
        with pytest.raises(ValidationError) as exc_info:
            SemanticSimilarityResponse(
                clusters=[],
                similarity_matrix="invalid",
                grouped_keywords={},
                embeddings_shape=(0, 768),
                metadata={},
                timing=1.0
            )
        assert "similarity_matrix" in str(exc_info.value)

    def test_invalid_embeddings_shape_type(self):
        """Test validation with non-tuple embeddings shape."""
        with pytest.raises(ValidationError) as exc_info:
            SemanticSimilarityResponse(
                clusters=[],
                similarity_matrix=[],
                grouped_keywords={},
                embeddings_shape="invalid",
                metadata={},
                timing=1.0
            )
        assert "embeddings_shape" in str(exc_info.value)

    def test_invalid_timing_type(self):
        """Test validation with non-float timing."""
        # Pydantic will coerce string "1.5" to float 1.5
        response = SemanticSimilarityResponse(
            clusters=[],
            similarity_matrix=[],
            grouped_keywords={},
            embeddings_shape=(0, 768),
            metadata={},
            timing="1.5"
        )
        assert response.timing == 1.5

    def test_negative_timing(self):
        """Test validation with negative timing."""
        # Pydantic allows negative values by default
        response = SemanticSimilarityResponse(
            clusters=[],
            similarity_matrix=[],
            grouped_keywords={},
            embeddings_shape=(0, 768),
            metadata={},
            timing=-1.0
        )
        assert response.timing == -1.0


class TestModelSerialization:
    """Test model serialization and deserialization."""

    def test_instagram_request_roundtrip(self):
        """Test InstagramDownloadRequest serialization roundtrip."""
        original = InstagramDownloadRequest(
            url="https://instagram.com/reel/123",
            browser_cookies="chrome"
        )
        json_str = original.json()
        parsed = InstagramDownloadRequest.parse_raw(json_str)
        assert parsed.url == original.url
        assert parsed.browser_cookies == original.browser_cookies

    def test_ner_request_roundtrip(self):
        """Test NERRequest serialization roundtrip."""
        original = NERRequest(
            text="Test text",
            language="es",
            include_relationships=False
        )
        json_str = original.json()
        parsed = NERRequest.parse_raw(json_str)
        assert parsed.text == original.text
        assert parsed.language == original.language
        assert parsed.include_relationships == original.include_relationships

    def test_semantic_request_roundtrip(self):
        """Test SemanticSimilarityRequest serialization roundtrip."""
        original = SemanticSimilarityRequest(
            keywords=["cat", "dog"],
            language="fr",
            cluster=True
        )
        json_str = original.json()
        parsed = SemanticSimilarityRequest.parse_raw(json_str)
        assert parsed.keywords == original.keywords
        assert parsed.language == original.language
        assert parsed.cluster == original.cluster


class TestModelDefaults:
    """Test model default values."""

    def test_instagram_request_defaults(self):
        """Test InstagramDownloadRequest default values."""
        request = InstagramDownloadRequest(url="https://test.com")
        assert request.output_path is None
        assert request.browser_cookies is None
        assert request.cookies_file is None

    def test_ner_request_defaults(self):
        """Test NERRequest default values."""
        request = NERRequest(text="Test")
        assert request.language == "en"
        assert request.include_relationships is True

    def test_semantic_request_defaults(self):
        """Test SemanticSimilarityRequest default values."""
        request = SemanticSimilarityRequest(keywords=["test"])
        assert request.language == "en"
        assert request.cluster is True

    def test_instagram_response_defaults(self):
        """Test InstagramDownloadResponse default values."""
        response = InstagramDownloadResponse(success=True)
        assert response.video_path is None
        assert response.caption is None
        assert response.username is None
        assert response.duration is None
        assert response.error is None
