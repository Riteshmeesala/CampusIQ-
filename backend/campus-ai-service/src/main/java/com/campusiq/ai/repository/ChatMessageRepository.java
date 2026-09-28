package com.campusiq.ai.repository;

import com.campusiq.ai.entity.ChatMessage;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    @Query("SELECT m FROM ChatMessage m WHERE m.userId = :uid AND m.sessionId = :sid ORDER BY m.createdAt DESC")
    List<ChatMessage> findRecentByUserAndSession(@Param("uid") Long uid, @Param("sid") String sid, Pageable pageable);

    @Query("SELECT DISTINCT m.sessionId FROM ChatMessage m WHERE m.userId = :uid ORDER BY m.sessionId DESC")
    List<String> findSessionsByUser(@Param("uid") Long uid);

    List<ChatMessage> findBySessionIdOrderByCreatedAtAsc(String sessionId);

    List<ChatMessage> findByUserIdAndSessionIdOrderByCreatedAtAsc(Long userId, String sessionId);

    long countBySessionId(String sessionId);

    @Modifying
    @Transactional
    @Query("DELETE FROM ChatMessage m WHERE m.sessionId = :sid AND m.userId = :uid")
    void deleteByUserIdAndSessionId(@Param("uid") Long userId, @Param("sid") String sessionId);

    @Modifying
    @Transactional
    @Query("DELETE FROM ChatMessage m WHERE m.sessionId = :sid")
    void deleteBySessionId(@Param("sid") String sessionId);
}
