from app.services.vector_store import vector_store

if __name__ == "__main__":
    print("Initializing Qdrant Vector Store...")
    # Access the .client property to trigger the lazy initialization
    _ = vector_store.client
    print("Vector Store successfully populated!")
