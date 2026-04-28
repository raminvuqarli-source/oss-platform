import time
import requests  # Əgər xəta versə, terminalda 'pip install requests' yaz


def stress_test(requests_count):
    # BURANI DƏYİŞ: Sənin sistemində işləyən bir API linki yaz
    # Məsələn: "http://localhost:3000/api/rooms"
    url = "http://localhost:3000"

    start_time = time.time()
    print(f"--- {requests_count} sorğu göndərilir: {url} ---")

    success = 0
    for i in range(requests_count):
        try:
            response = requests.get(url)
            if response.status_code == 200:
                success += 1
        except:
            pass

    end_time = time.time()
    print(f"\nUğurlu: {success}/{requests_count}")
    print(f"Ümumi vaxt: {end_time - start_time:.4f} saniyə")


stress_test(100)
