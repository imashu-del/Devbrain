import os
import cognee
import dotenv

# Load environment variables
dotenv.load_dotenv()

async def init_memory():
    """Initializes and runs internal cognee configurations."""
    # Ensure environment variables are loaded
    dotenv.load_dotenv()
    
    # Configure directories locally inside the workspace directory
    workspace_dir = os.path.dirname(os.path.abspath(__file__))
    cognee.config.system_root_directory(os.path.join(workspace_dir, ".cognee_system"))
    cognee.config.data_root_directory(os.path.join(workspace_dir, ".cognee_data"))
    
    # Expose Google Gemini configuration programmatically
    llm_provider = os.getenv("LLM_PROVIDER", "gemini")
    embedding_provider = os.getenv("EMBEDDING_PROVIDER", "gemini")
    
    cognee.config.set_llm_provider(llm_provider)
    cognee.config.set_embedding_provider(embedding_provider)
    cognee.config.set_embedding_dimensions(768)
    
    # If there's an API key in the env, pass it
    llm_api_key = os.getenv("LLM_API_KEY")
    if llm_api_key and "your_" not in llm_api_key:
        cognee.config.set_llm_api_key(llm_api_key)
        cognee.config.set_embedding_api_key(llm_api_key)
        
    google_api_key = os.getenv("GOOGLE_API_KEY")
    if google_api_key and "your_" not in google_api_key:
        os.environ["GOOGLE_API_KEY"] = google_api_key
        cognee.config.set_llm_api_key(google_api_key)
        cognee.config.set_embedding_api_key(google_api_key)

    print(f"Cognee initialized with LLM={llm_provider}, Embeddings={embedding_provider} (768d).")
    print(f"System directory set to: {os.path.join(workspace_dir, '.cognee_system')}")

async def store_memory(text_context: str):
    """Wraps await cognee.remember(text_context) to ingest repository updates."""
    await cognee.remember(text_context)

async def query_memory(query: str) -> str:
    """Wraps await cognee.recall(query) to pull architecture data out."""
    results = await cognee.recall(query_text=query)
    
    formatted_results = []
    for result in results:
        if hasattr(result, "text") and result.text:
            formatted_results.append(result.text)
        elif hasattr(result, "content") and result.content:
            formatted_results.append(result.content)
        elif hasattr(result, "answer") and result.answer:
            formatted_results.append(result.answer)
        elif isinstance(result, dict):
            val = result.get("text") or result.get("content") or result.get("answer") or str(result)
            formatted_results.append(val)
        else:
            formatted_results.append(str(result))
            
    return "\n".join(formatted_results)

async def optimize_memory():
    """Wraps await cognee.improve() to prune stale/duplicate nodes and balance graph weights."""
    await cognee.improve()

async def purge_memory(dataset_name: str):
    """Wraps await cognee.forget(dataset_name) to wipe discarded prototyping runs."""
    # Note: cognee.forget takes keyword-only arguments, so we pass dataset=dataset_name
    await cognee.forget(dataset=dataset_name)

if __name__ == "__main__":
    import asyncio
    
    async def run_test():
        print("--- Cognee Local Memory Test (Gemini Edition) ---")
        await init_memory()
        
        api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("LLM_API_KEY")
        if not api_key or "your_gemini_api_key_here" in api_key:
            print("\n[WARNING] GOOGLE_API_KEY / LLM_API_KEY is not configured with a valid key in .env.")
            print("Please set your Gemini API key in .env to run the full end-to-end test.")
            print("Skipping LLM-dependent remember/recall steps.")
            return
            
        print("\nStoring example memory...")
        try:
            memory_item = "DevBrain is powered by local Cognee + Gemini."
            await store_memory(memory_item)
            print(f"Stored: '{memory_item}'")
            
            print("\nQuerying memory...")
            query = "How is DevBrain powered?"
            result = await query_memory(query)
            print(f"Query: '{query}'")
            print(f"Result:\n{result}")
            
        except Exception as e:
            print(f"\nTest execution failed: {e}")
            print("Verify your Gemini API key has correct permissions and balance.")
            
    asyncio.run(run_test())
