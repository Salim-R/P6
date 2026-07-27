import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { API_URL } from './api.config';
import { Sauce, SaucePayload, Vote } from './sauce.model';

interface VoteResponse {
  message: string;
  likes: number;
  dislikes: number;
}

@Injectable({ providedIn: 'root' })
export class SaucesService {
  private readonly http = inject(HttpClient);

  list() {
    return this.http.get<Sauce[]>(`${API_URL}/sauces`);
  }

  byId(id: string) {
    return this.http.get<Sauce>(`${API_URL}/sauces/${id}`);
  }

  create(sauce: SaucePayload, image: File) {
    return this.http.post<{ message: string }>(`${API_URL}/sauces`, this.toFormData(sauce, image));
  }

  /**
   * L'API attend un multipart quand l'image change, et du JSON sinon.
   * Le service encapsule cette distinction pour que les composants n'aient pas
   * à la connaître.
   */
  update(id: string, sauce: SaucePayload, image?: File) {
    const body = image ? this.toFormData(sauce, image) : sauce;
    return this.http.put<{ message: string }>(`${API_URL}/sauces/${id}`, body);
  }

  remove(id: string) {
    return this.http.delete<{ message: string }>(`${API_URL}/sauces/${id}`);
  }

  /** L'API renvoie les compteurs à jour : on les utilise au lieu de les deviner. */
  vote(id: string, like: Vote) {
    return this.http.post<VoteResponse>(`${API_URL}/sauces/${id}/like`, { like });
  }

  private toFormData(sauce: SaucePayload, image: File): FormData {
    const formData = new FormData();
    formData.append('sauce', JSON.stringify(sauce));
    formData.append('image', image);
    return formData;
  }
}
